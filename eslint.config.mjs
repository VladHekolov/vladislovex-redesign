export default [
  {
    files: ['assets/js/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        AbortController: 'readonly',
        Blob: 'readonly',
        CustomEvent: 'readonly',
        DOMParser: 'readonly',
        Event: 'readonly',
        FileReader: 'readonly',
        FormData: 'readonly',
        Image: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        history: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        queueMicrotask: 'readonly',
        requestAnimationFrame: 'readonly',
        setInterval: 'readonly',
        setTimeout: 'readonly',
        window: 'readonly'
      }
    },
    rules: {
      'no-constant-condition': 'error',
      'no-dupe-args': 'error',
      'no-dupe-else-if': 'error',
      'no-func-assign': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['error', {
        args: 'none',
        caughtErrors: 'none',
        vars: 'all'
      }]
    }
  }
];
