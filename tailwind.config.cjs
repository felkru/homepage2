/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {},
	},
	plugins: [require("@tailwindcss/typography"),require("daisyui")],
	daisyui: {
		themes: [
			{
				mytheme: {
					"primary": "#FF5CE4",
					"secondary": "#F6A2E5",
					"accent": "#6D2197",
					"neutral": "#ffaadd",
					"base-100": "#fffbff",
					"info": "#ffaadd",
					"success": "#F500CC",
					"warning": "#a447d7",
					"error": "#ffffff",
				},
			},
		],// true: all themes | false: only light + dark | array: specific themes like this ["light", "dark", "cupcake"]
		darkTheme: "dark", // name of one of the included themes for dark mode
		logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
	  }
}
