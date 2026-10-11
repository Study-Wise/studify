// Centralized modal factory. Every modal in the app is built here so they
// share markup, styles (src/styles/components/modal.scss) and behavior.
// Client-side only: it touches the DOM.

export type ModalType = 'info' | 'error' | 'warning' | 'success';

export interface ModalButton {
    label: string;
    variant?: 'primary' | 'secondary';
    // Return false to keep the modal open after the click
    onClick?: () => void | boolean;
}

export interface ModalContent {
    title: string;
    message: string;
    type?: ModalType;
    // Material Symbols icon name; defaults to one matching the type
    icon?: string;
    // Defaults to a single "OK" button that closes the modal
    buttons?: ModalButton[];
}

export interface ModalOptions extends ModalContent {
    onClose?: () => void;
}

export interface Modal {
    readonly element: HTMLDialogElement;
    open(): void;
    close(): void;
    setContent(content: ModalContent): void;
}

const defaultIcons: Record<ModalType, string> = {
    info: 'info',
    error: 'error',
    warning: 'warning',
    success: 'check_circle',
};

const defaultButtons: ModalButton[] = [{ label: 'OK', variant: 'primary' }];

let modalCount = 0;

/**
 * Create a modal and add it to the page. It stays closed until open() is called.
 * @param options - The modal's content and close callback
 * @returns The modal
 */
export function createModal(options: ModalOptions): Modal {
    const titleId = `modal-title-${++modalCount}`;

    const element = document.createElement('dialog');
    element.className = 'modal';
    element.setAttribute('aria-labelledby', titleId);

    const content = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'modal-header';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined modal-icon';
    icon.setAttribute('aria-hidden', 'true');
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.id = titleId;
    header.append(icon, title);

    const body = document.createElement('div');
    body.className = 'modal-body';
    const message = document.createElement('p');
    message.className = 'modal-message';
    body.append(message);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    content.append(header, body, footer);
    element.append(content);
    document.body.append(element);

    function focusPrimaryButton() {
        footer.querySelector<HTMLButtonElement>('.modal-button-primary')?.focus();
    }

    function setContent({ title: titleText, message: messageText, type = 'info', icon: iconName, buttons = defaultButtons }: ModalContent) {
        content.className = `modal-content modal-${type}`;
        icon.textContent = iconName ?? defaultIcons[type];
        title.textContent = titleText;
        message.textContent = messageText;

        footer.replaceChildren(...buttons.map(({ label, variant = 'primary', onClick }) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `modal-button modal-button-${variant}`;
            button.textContent = label;
            button.addEventListener('click', () => {
                if (onClick?.() !== false) {
                    element.close();
                }
            });
            return button;
        }));

        if (element.open) {
            focusPrimaryButton();
        }
    }

    // Close on backdrop click; Escape is handled natively by <dialog>
    element.addEventListener('click', (event) => {
        if (event.target === element) {
            element.close();
        }
    });

    if (options.onClose) {
        element.addEventListener('close', options.onClose);
    }

    setContent(options);

    return {
        element,
        open() {
            if (!element.open) {
                element.showModal();
            }
            focusPrimaryButton();
        },
        close() {
            element.close();
        },
        setContent,
    };
}
