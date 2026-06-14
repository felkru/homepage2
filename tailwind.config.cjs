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
                    primary: "#5eead4",
                    secondary: "#7dd3fc",
                    accent: "#f5a623",
                    neutral: "#111722",
                    "base-100": "#0a0e14",
                    "base-200": "#0f1520",
                    "base-300": "#1e2735",
                    "base-content": "#e8edf5",
                    info: "#7dd3fc",
                    success: "#5eead4",
                    warning: "#f5a623",
                    error: "#f87171",
                },
            },
        ], // true: all themes | false: only light + dark | array: specific themes like this ["light", "dark", "cupcake"]
        darkTheme: "dark", // name of one of the included themes for dark mode
        logs: false, // Shows info about daisyUI version and used config in the console when building your CSS
    },
};
