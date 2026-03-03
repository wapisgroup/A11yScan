declare module "vitest" {
  export const describe: (...args: any[]) => any;
  export const it: (...args: any[]) => any;
  export const expect: (...args: any[]) => any;
  export const vi: any;
  export const beforeEach: (...args: any[]) => any;
}

declare module "vitest/config" {
  export const defineConfig: (config: any) => any;
}
