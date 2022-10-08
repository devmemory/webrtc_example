const util = {
    delay: (ms:number) => {
        // ms 만큼 딜레이
        return new Promise<void>((res) => {
            const timer = setTimeout(() => {
                res()
                clearTimeout(timer)
            }, ms);
        })
    },
}

export default util