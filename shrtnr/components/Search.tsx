import Autocomplete from "@mui/joy/Autocomplete"
import AutocompleteOption from '@mui/joy/AutocompleteOption'
import FormLabel from "@mui/joy/FormLabel"
import FormControl from "@mui/joy/FormControl"
import React, { useEffect, useRef, useState } from "react"
import Grid from "@mui/joy/Grid/Grid"
import ShortLinkManager from "./ShortLinkManager"
import { URLWithoutProtocol } from "@/lib/urls"
import { PartialShortLink, ShortLink, ShortLinkData, ShortLinkDataWithoutViews } from "@/lib/models/short-link"


export default function LinkShortenerInput() {
    const ref = useRef<HTMLInputElement>(null)
    const [creating, setCreating] = React.useState<boolean>(false)
    const [inputValue, setInputValue] = React.useState<string>('')
    const [link, setLink] = React.useState<PartialShortLink | null>(null)
    const [options, setOptions] = useState<PartialShortLink[]>([])

    useEffect(() => {
        if (inputValue == '') {
            ref.current?.focus()
        }
        else if (inputValue.length > 1) {
            fetch(`/api/links/search`, { method: 'POST', body: JSON.stringify({ query: inputValue }) })
                .then(response => response.json())
                .then(({ results }: { results: ShortLinkDataWithoutViews[] }) => {

                    if (results) {
                        const mapped = results.map(link => {
                            return {
                                short: new URLWithoutProtocol(link.short),
                                long: new URLWithoutProtocol(link.long)
                            }
                        })
                        setOptions(mapped)
                    }
                })
                .catch(error => console.error(error))
        }
    }, [inputValue])

    const getLink = (url: string) => {
        fetch(`/api/links/${url}`)
            .then(response => response.json())
            .then((data: ShortLinkData) => {
                setLink({
                    short: new URLWithoutProtocol(data.short),
                    long: new URLWithoutProtocol(data.long),
                    views: data.views
                })
            })
    }

    const createLink = (url: string) => {
        setCreating(true)
        fetch('/api/links', {
            method: 'POST',
            body: JSON.stringify({ url })
        })
            .then(response => response.json())
            .then((data: ShortLink) => {
                data.short = new URLWithoutProtocol(data.short)
                data.long = new URLWithoutProtocol(data.long)
                setLink(data)
                setCreating(false)
            })
    }

    return (
        <Grid container marginTop={'30vh'} spacing={1} flexDirection={'column'} maxWidth={'600px'}>
            <Grid maxWidth='100%'>
                <FormControl id="find-or-shorten-form">
                    <FormLabel style={{ fontSize: '28px', marginBottom: '7px' }}>🔍 Find or 🩳 shorten a 🔗 link</FormLabel>
                    <Autocomplete
                        placeholder={'https://xyz.abc/123'}
                        value={link?.long.toString()}
                        inputValue={inputValue}
                        onInputChange={(_, newInputValue) => {
                            setInputValue(newInputValue)
                        }}
                        onChange={(event, newValue, reason) => {

                            if (reason === 'selectOption' && newValue) {
                                // It will be an object if it's an option which was returned by search
                                if (typeof newValue === 'object') {

                                    if (newValue.short && newValue.short instanceof URL) {
                                        getLink(newValue.short.pathname)
                                    }
                                    else {
                                        createLink(newValue.long.toString())
                                    }
                                }
                                // Otherwise, it's a string
                                else {
                                    createLink(newValue)
                                }
                            }
                            else if (reason === 'clear') {
                                setLink(null)
                            }
                            else if (reason === 'createOption' && typeof newValue === 'string') {
                                createLink(newValue)
                            }
                        }}
                        style={{ padding: '0 24px' }}
                        isOptionEqualToValue={(option, value) => option?.long === value?.long}
                        options={options}
                        freeSolo
                        selectOnFocus
                        handleHomeEndKeys
                        autoFocus
                        clearOnEscape
                        slotProps={{
                            input: {
                                ref: ref
                            }
                        }}
                        renderOption={(props, option) => {
                            const style = {
                                ...props.style,
                                paddingLeft: '23px',
                                paddingRight: '23px'
                            }
                            props.style = style

                            if (option.short) {
                                return (
                                    <AutocompleteOption {...props}>
                                        <Grid display={"flex"} container flexDirection={"row"} width={"100%"}>
                                            <Grid xs={7}>{option.long.toString()}</Grid>
                                            <Grid xs={1} textAlign={'right'}>🩳</Grid>
                                            <Grid xs={4} textAlign={'right'}>{option.short.toString()}</Grid>
                                        </Grid>
                                    </AutocompleteOption>
                                )
                            }
                            else {
                                return (
                                    <AutocompleteOption {...props}>
                                        <Grid display={"flex"} container flexDirection={"row"} width={"100%"}>
                                            <Grid>{option.text}</Grid>
                                            <Grid>&nbsp;👖✂️</Grid>
                                        </Grid>
                                    </AutocompleteOption>
                                )
                            }
                        }}
                        sx={{ width: 600, maxWidth: '100%', borderRadius: '12px' }}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option.long.toString()
                        }
                        filterOptions={(options, params) => {

                            if (params.inputValue !== '') {
                                options.push({
                                    short: null,
                                    long: params.inputValue,
                                    text: `Shorten "${params.inputValue}"`,
                                    views: {
                                        today: 0,
                                        week: 0,
                                        all: 0
                                    }
                                })
                            }
                            return options
                        }}
                    />
                </FormControl>
            </Grid>
            <Grid>
                {link && <ShortLinkManager link={link as ShortLink} setLink={setLink} setInputValue={setInputValue} />}
            </Grid>
        </Grid>
    )
}