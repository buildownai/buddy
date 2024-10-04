type E = Error & { status?: number }

export const errorToMessage = (err: unknown) => {
  if (err instanceof Error) {
    if (!(err as E).status) {
      return 'error.unknown'
    }
    switch ((err as E).status) {
      case 404:
        return 'error.404'
      case 401:
        return 'error.401'
      case 403:
        return 'error.403'
    }
  }
  return 'error.unknown'
}
