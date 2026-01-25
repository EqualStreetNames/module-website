'use strict';

export default function (
  person: {
    nicknames?: {
      de?: { language: string; value: string };
      en?: { language: string; value: string };
      fr?: { language: string; value: string };
      nl?: { language: string; value: string };
    };
  },
  lang: string
): string | null {
  if (
    typeof person.nicknames === 'undefined' ||
    person.nicknames === null ||
    Object.keys(person.nicknames).length === 0
  ) {
    return null;
  }

  return typeof person.nicknames[lang as keyof typeof person.nicknames] !== 'undefined'
    ? person.nicknames[lang as keyof typeof person.nicknames].value
    : null;
}
