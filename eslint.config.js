
import reactCompiler from "eslint-plugin-react-compiler";

export default [
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { "react-compiler": reactCompiler },
    rules: {
      ...reactCompiler.configs.recommended.rules,
    },
  },
];