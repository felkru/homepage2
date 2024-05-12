/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    theme: {
        extend: {
            aspectRatio: {
                "1xA4": "210/297",
                "2xA4": "105/297",
                "3xA4": "70/297",
                "4xA4": "53/297",
                "5xA4": "42/297",
                "10xA4": "21/297",
            },
        },
    },
    plugins: [require("@tailwindcss/typography"), require("daisyui")],
    daisyui: {
        themes: [
            {
                mytheme: {
                    primary: "#f17f38",
                    secondary: "#f6c5a2",
                    accent: "#f12828",
                    neutral: "#ffd5aa",
                    "base-100": "#fffbf8",
                    info: "#ffd0aa",
                    success: "#f54a00",
                    warning: "#d74747",
                    error: "#ff0000",
                },
            },
        ], // true: all themes | false: only light + dark | array: specific themes like this ["light", "dark", "cupcake"]
        darkTheme: "dark", // name of one of the included themes for dark mode
        logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
    },
};
