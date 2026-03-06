/** @type {import('tailwindcss').Config} */
export const content = ['./src/**/*.{html,ts}'];
export const theme = {
  extend: {
    fontFamily: {
      localNames: ['var(--ion-font-family-local-names)'],
      englishTitles: ['var(--ion-font-family-english-titles)'],
      menuItems: ['var(--ion-font-family-menu-items)'],
    },
  },
};
