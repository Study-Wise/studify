interface Mode {
    name: string;
    description: string;
    icon?: string;
    prompt?: Promise<any>;
    show?: true | false;
}

interface Category {
    name: string;
    description: string;
    modes: Record<string, Mode>;
}

export type { Mode, Category };