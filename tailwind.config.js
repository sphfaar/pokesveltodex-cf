/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      gridTemplateColumns: {
        pokegrid: 'repeat(auto-fill, minmax(308px, 1fr))'
      },
      animation: {
        'spin-fast': 'spin 0.3s linear infinite'
      },
      colors: {
        normal: '#a8a878',
        fire: '#f08030',
        fighting: '#c03028',
        water: '#6890f0',
        flying: '#a890f0',
        grass: '#78c850',
        poison: '#a040a0',
        electric: '#f8d030',
        ground: '#e0c068',
        psychic: '#f85888',
        rock: '#b8a038',
        ice: '#98d8d8',
        bug: '#a8b820',
        dragon: '#7038f8',
        ghost: '#705898',
        dark: '#705848',
        steel: '#b8b8d0',
        fairy: '#ee99ac',
        unknow: '#68a090' // type ???
      }
    },
  },
  plugins: [],
}

