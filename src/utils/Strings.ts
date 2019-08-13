export class Strings {
    public static parseList(stringList: string): string[] {
        return stringList.replace(/\s/g, '')
            .split(',')
            .filter((item): boolean => item !== '');
    }
}

