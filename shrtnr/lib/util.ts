import { Err, Ok, Result } from "ts-results-es";

const base = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789";

function toBase58(id: number): string {
  let result = "";
  while (id > 0) {
    result = base[id % base.length] + result;
    id = Math.floor(id / base.length);
  }
  return result;
}

function fromBase58(str: string): number {
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    result = result * base.length + base.indexOf(str[i]);
  }
  return result;
}

async function wrapResultAsync<T>(
  func: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const result = await func();
    return Ok(result);
  } catch (error: any) {
    return Err(error instanceof Error ? error : new Error(error));
  }
}

export { fromBase58, toBase58, wrapResultAsync };