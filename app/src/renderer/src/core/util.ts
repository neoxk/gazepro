const shuffle = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

const ciIncludes = (arr: string[], val: string): boolean =>
  arr.some(v => v.localeCompare(val, undefined, { sensitivity: 'accent' }) === 0);


export {shuffle, ciIncludes}