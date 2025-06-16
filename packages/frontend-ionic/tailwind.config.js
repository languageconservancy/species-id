/** @type {import('tailwindcss').Config} */
export const content = ['./src/**/*.{html,ts}'];
export const theme = {
  extend: {
    fontFamily: {
      localNames: ['var(--ion-font-family-local-names)'],
    },
  },
};
