export async function readExample(
  style: string,
  name: string,
  format: string,
): Promise<string> {
  return await Deno.readTextFile(
    new URL(`./${style}.ex.${name}.${format}`, import.meta.url),
  );
}
