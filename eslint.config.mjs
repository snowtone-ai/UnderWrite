import next from "eslint-config-next";

// eslint-config-next v16 exports a ready flat-config array.
const config = [
  ...next,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
