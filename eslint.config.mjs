import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
 
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
 
const compat = new FlatCompat({
  baseDirectory: __dirname,
});
 
const eslintConfig = [
  {
    // FlatCompat não herda os ignores por omissão do eslint-config-next
    // (ex: .next/) — sem isto, um `.next/` deixado por um build anterior faz
    // o lint varrer os .ts auto-gerados em .next/types/ e rebentar com
    // milhares de erros que nada têm a ver com o código-fonte.
    ignores: [".next/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // Sub-projecto 5 do audit de type-safety: o código já usa quase
      // exclusivamente `interface` para formas de objecto (confirmado —
      // só havia 2 excepções em todo o repo, uma delas um falso positivo
      // de union). Esta regra torna essa convenção obrigatória daqui em
      // diante; `type` continua livre para uniões, tuplos, mapped types,
      // etc. (a regra só actua sobre `type X = { ... }`).
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    },
  },
];
 
export default eslintConfig;
 