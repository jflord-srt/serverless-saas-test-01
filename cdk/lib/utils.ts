import * as _ from "lodash";

export function toLowerKebabCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

//Credits (modified code): Bob Jenkins (http://www.burtleburtle.net/bob/hash/doobs.html)
//See also: https://en.wikipedia.org/wiki/Jenkins_hash_function
//Takes a string of any size and returns an avalanching hash string of 8 hex characters.
export function hash16(value: string) {
  let hash = 0;
  for (let charIndex = 0; charIndex < value.length; ++charIndex) {
    hash += value.charCodeAt(charIndex);
    hash += hash << 10;
    hash ^= hash >> 6;
  }
  hash += hash << 3;
  hash ^= hash >> 11;
  //4,294,967,295 is FFFFFFFF, the maximum 32 bit unsigned integer value, used here as a mask.
  return (((hash + (hash << 15)) & 4294967295) >>> 0).toString(16);
}

/**
 * Remove duplicate "/" that often arise when building urls from sub-strings
 * @param url
 * @returns normalized url
 */
export function joinUrlPaths(base: string, ...params: string[]): string {
  let path = params.join("/").replace(/\/+/g, "/");

  base = _.trimEnd(base, "/");
  path = _.trimStart(path, "/");

  return `${base}/${path}`;
}
