// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface Platform {
      env: Env
      cf: CfProperties
      ctx: ExecutionContext
    }
  }
  namespace svelteHTML {
    interface HTMLAttributes {
      'on:enterViewport'?: (event: CustomEvent) => void;
      'on:exitViewport'?: (event: CustomEvent) => void;
    }
  }
}

export { };
