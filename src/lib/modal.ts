// Centralized modal factory. Every modal in the app is built here so they
// share markup, styles (src/styles/components/modal.scss) and behavior.
// Client-side only: it touches the DOM.

export type ModalType = 'info' | 'error' | 'warning' | 'success';

// 'modal' blocks the page until dismissed; 'toast' is a non-blocking
// notification in the corner of the screen that closes itself
export type ModalDisplay = 'modal' | 'toast';

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
    // Defaults to 'modal'
    display?: ModalDisplay;
    // Toasts only: milliseconds before the toast closes itself while not
    // hovered or focused. Defaults to 5000; 0 keeps it open until dismissed.
    duration?: number;
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

const defaultToastDuration = 5000;

let modalCount = 0;

/**
 * Get the container toasts stack in, creating it on first use
 * @returns The toast container
 */
function getToastRegion(): HTMLElement {
    let region = document.querySelector<HTMLElement>('.toast-region');
    if (!region) {
        region = document.createElement('div');
        region.className = 'toast-region';
        document.body.append(region);
    }
    return region;
}

/**
 * Create a modal and add it to the page. It stays closed until open() is called.
 * @param options - The modal's content and close callback
 * @returns The modal
 */
export function createModal(options: ModalOptions): Modal {
    const { display = 'modal', duration = defaultToastDuration } = options;
    const isToast = display === 'toast';
    const titleId = `modal-title-${++modalCount}`;

    const element = document.createElement('dialog');
    element.className = isToast ? 'modal modal-toast' : 'modal';
    element.setAttribute('aria-labelledby', titleId);
    if (isToast) {
        // Announce the toast without moving focus to it
        element.setAttribute('role', 'status');
        element.setAttribute('aria-live', 'polite');
    }

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

    if (isToast) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'modal-close';
        closeButton.setAttribute('aria-label', 'Dismiss');
        const closeIcon = document.createElement('span');
        closeIcon.className = 'material-symbols-outlined';
        closeIcon.setAttribute('aria-hidden', 'true');
        closeIcon.textContent = 'close';
        closeButton.append(closeIcon);
        closeButton.addEventListener('click', () => element.close());
        header.append(closeButton);
    }

    const body = document.createElement('div');
    body.className = 'modal-body';
    const message = document.createElement('p');
    message.className = 'modal-message';
    body.append(message);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    content.append(header, body, footer);
    element.append(content);
    (isToast ? getToastRegion() : document.body).append(element);

    function focusPrimaryButton() {
        footer.querySelector<HTMLButtonElement>('.modal-button-primary')?.focus();
    }

    // Toasts have their own close button, so they need no footer buttons
    function setContent({ title: titleText, message: messageText, type = 'info', icon: iconName, buttons = isToast ? [] : defaultButtons }: ModalContent) {
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
        footer.hidden = buttons.length === 0;

        // Toasts never take focus away from what the user is doing
        if (element.open && !isToast) {
            focusPrimaryButton();
        }
    }

    // Toasts close themselves after `duration`, paused while the user is
    // hovering over or focused inside them so they can finish reading
    let dismissTimer: ReturnType<typeof setTimeout> | undefined;

    function stopDismissTimer() {
        clearTimeout(dismissTimer);
        dismissTimer = undefined;
    }

    function startDismissTimer() {
        stopDismissTimer();
        if (isToast && duration > 0 && element.open && !element.matches(':hover, :focus-within')) {
            dismissTimer = setTimeout(() => element.close(), duration);
        }
    }

    if (isToast) {
        element.addEventListener('mouseenter', stopDismissTimer);
        element.addEventListener('focusin', stopDismissTimer);
        element.addEventListener('mouseleave', startDismissTimer);
        element.addEventListener('focusout', (event) => {
            // Focus moving between elements inside the toast doesn't count
            const target = event.relatedTarget;
            if (!(target instanceof Node && element.contains(target))) {
                startDismissTimer();
            }
        });
    }
    else {
        // Close on backdrop click; Escape is handled natively by <dialog>
        element.addEventListener('click', (event) => {
            if (event.target === element) {
                element.close();
            }
        });
    }

    element.addEventListener('close', stopDismissTimer);

    if (options.onClose) {
        element.addEventListener('close', options.onClose);
    }

    setContent(options);

    return {
        element,
        open() {
            if (isToast) {
                // show() keeps the rest of the page usable, unlike showModal()
                if (!element.open) {
                    // show() focuses the close button, so hand focus back
                    // to wherever the user was
                    const previous = document.activeElement;
                    element.show();
                    if (previous instanceof HTMLElement && previous !== document.body) {
                        previous.focus({ preventScroll: true });
                    }
                    // If focus couldn't go back (e.g. that element was
                    // disabled or removed), take it off the toast anyway so
                    // the toast still closes itself
                    if (element.contains(document.activeElement) && document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                    }
                }
                // Reopening an open toast restarts its countdown
                startDismissTimer();
                return;
            }
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
