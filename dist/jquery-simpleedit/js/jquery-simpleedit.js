/**
 * SimpleEdit Plugin.
 *
 * @param {string|function|object} methods
 */
$.fn.simpleedit = function (...methods) {
    const settings = $.extend({}, $.fn.simpleedit.defaults, ...methods)

    this.each(function () {
        // Remove previous assignments
        $(this).trigger('simpleedit.remove')

        // Assign method
        let error = false
        const object = settings
        for (let method in methods) {
            method = methods[method]
            if (typeof method === 'function') {
                // Add every function to the callbacks array
                object.callbacks.push(method)
            } else if (typeof method === 'string' && method.includes('/')) {
                // Everything with a slash is the url
                object.url = method
            } else if (typeof method === 'string') {
                // Find method
                const result = findMethod(method)
                if (result) {
                    // Assign found method
                    object[result] = method
                } else {
                    error = true
                    console.error(`SimpleEdit: Could not find an option for '${method}'`)
                }
            }
        }

        // Give available options on error // TODO: link to documentation
        if (error) {
            console.error('Available options are: (Pick one from the arrays)', settings.availableOptions)
            return
        }

        // Create instance
        new SimpleEdit(this, object)
    })

    return this
}

/**
 * SimpleEdit default options.
 */
$.fn.simpleedit.defaults = {
    // Available auto assign methods
    availableOptions: {
        mode: ['inline'], // Todo: popup
        onblur: ['cancel', 'submit', 'ignore'],
        type: [
            'text', // Todo: datepicker, datetimepicker, select, textarea, typeahead.js, multiselect, select2
        ],
    },
    ajaxOptions: {
        type: 'POST',
    },
    buttons: {
        submit: `<button class="submit"><span>&#10004;</span></button>`,
        abort: `<button class="abort"><span>&#10006;</span></button>`,
        spinner: `<button class="loader"><span class="simpleedit-spinner">&#11211;</span></button>`,
    },
    callbacks: [],
    error: null,
    mode: 'inline',
    onblur: 'cancel',
    success: null,
    type: 'text',
}

/**
 * SimpleEdit class.
 */
class SimpleEdit {
    /**
     * Edit constructor.
     *
     * @param {HTMLElement} element
     * @param {?object} object
     */
    constructor(element, object = {}) {
        this.element = element
        const defaults = $.fn.simpleedit.defaults

        this.ajaxOptions = object.ajaxOptions || defaults.ajaxOptions
        this.callbacks =   object.callbacks   || defaults.callbacks
        this.error =       object.error       || defaults.error
        this.mode =        object.mode        || defaults.mode
        this.onblur =      object.onblur      || defaults.onblur
        this.success =     object.success     || defaults.success
        this.type =        object.type        || defaults.type // Todo

        this.name =        object.name
        this.pk =          object.pk
        this.url =         object.url

        this.submitButton =  object.submitButton  || defaults.buttons.submit
        this.abortButton =   object.abortButton   || defaults.buttons.abort
        this.spinnerButton = object.spinnerButton || defaults.buttons.spinner

        this.init()
        this.initEvents()
    }

    /**
     * Initialization.
     */
    init() {
        // Removal event
        $(this.element).one('simpleedit.remove', () => $(this.element).off('click.simpleedit.edit'))
    }

    /**
     * Initialize edit event.
     */
    initEvents() {
        $(this.element).on('click.simpleedit.edit', () => {
            return this.enableEdit()
        })
    }

    /**
     * Enables the edit function.
     *
     * @returns {SimpleEdit}
     */
    enableEdit() {
        // Get properties of clicked element and hide element
        this.display = $(this.element).css('display')
        this.node = $(this.element).prop('nodeName')
        $(this.element).css('display', 'none')

        // Get text
        if ($(this.element).find('span.simpleedit-empty').length > 0) {
            this.text = ''
            $(this.element).find('span.simpleedit-empty').remove()
        } else {
            this.text = $(this.element).text()
        }

        // Build a pattern and append after clicked element
        this.buildPattern()
        $(this.element).after(this.pattern)

        // Select text inside input field
        this.pattern.find('input').select()

        // Clicking outside the element
        if (this.onblur !== 'ignore') this.handleOnblur()

        return this
    }

    /**
     * Disables the edit function.
     *
     * @returns {SimpleEdit}
     */
    disableEdit() {
        // Remove editable element
        $(this.pattern).remove()

        // Make original element visible again
        $(this.element).css('display', this.display)

        // Disable onblur event
        $(document).off('click.simpleedit.onblur')
        $(document).off('keyup.simpleedit.keypress')

        if (this.text.trim()) {
            // Set text in dom
            $(this.element).text(this.text)
        } else {
            // Set 'empty' text in dom
            const empty = `<span class="simpleedit-empty">Empty</span>`
            $(this.element).html(empty)
        }

        return this
    }

    /**
     * Build an edit pattern.
     *
     * @returns {SimpleEdit}
     */
    buildPattern() {
        // HTML
        this.pattern = $(
            `<${this.node} class="simpleedit">
                 <input type="text" value="${this.text}">
                 ${this.submitButton}
                 ${this.abortButton}
             </${this.node}>`
        )

        // Submit event
        $(this.pattern).find('button.submit').on('click', () => this.submit())

        // Abort event
        $(this.pattern).find('button.abort').on('click', () => this.disableEdit())

        // Key events
        $(document).on('keyup.simpleedit.keypress', e => {
            if (e.key === 'Enter'  || e.keyCode === 13) this.submit()
            if (e.key === 'Escape' || e.keyCode === 27) this.disableEdit()
        })

        return this
    }

    /**
     * Decide what happens when clicking outside the element.
     *
     * @returns {SimpleEdit}
     */
    handleOnblur() {
        if (this.onblur === 'cancel' || this.onblur === 'submit') {
            // Timeout required, because clicking the element will trigger the onblur event
            setTimeout(() => {
                // Listen for outside clicks
                $(document).on('click.simpleedit.onblur', (e) => {
                    // Check if clicked outside the edit element
                    if (!$(e.target).closest('.simpleedit').is(this.pattern)) {
                        switch (this.onblur) {
                            case 'cancel':
                                this.disableEdit()
                                break
                            case 'submit':
                                this.submit()
                                break
                        }
                    }
                })
            })
        }

        return this
    }

    /**
     * Submit text change.
     *
     * @returns {SimpleEdit}
     */
    submit() {
        // Get changed text
        const text = $(this.pattern).find('input').val()

        // If url is given
        const url = this.url || $(this.element).attr('data-url')
        if (url) {
            // Collect data
            let data = { value: text }
            data = Object.assign(data, this.collectAttributes())

            // Ajax options combined with default options
            let ajaxOptions = Object.assign(this.ajaxOptions, {
                'url': url,
                'data': data,
                'success': (response) => {
                    this.handleSuccess(text, response)
                },
                'error': (response) => {
                    this.handleError(response)
                },
            })

            // Replace submit button with loader
            // Timeout needed or onblur event can't find removed submit button click
            setTimeout(() => {
                this.pattern.find('button.submit').replaceWith(this.spinnerButton)
            })

            // Send ajax request
            $.ajax(ajaxOptions)
        } else {
            this.handleSuccess(text)
        }

        return this
    }

    /**
     * Get main attributes.
     *
     * @returns {object}
     */
    collectAttributes() {
        return {
            name: this.name || $(this.element).attr('data-name') || $(this.element).attr('id') || undefined,
            pk:   this.pk   || $(this.element).attr('data-pk')   || undefined,
        }
    }

    /**
     * Handle success.
     *
     * @param {string} text
     * @param response
     * @returns {SimpleEdit}
     */
    handleSuccess(text, response = null) {
        // If response status error, handle as error
        if (response && response.status === 'error') {
            this.handleError(response)
            return this
        }

        // Call the given success function for custom success handling
        if (this.success && typeof this.success === 'function') {
            this.success(response, text)
        }

        this.text = text
        this.disableEdit()

        // Call every callback function
        for (const callback in this.callbacks) {
            if (this.callbacks.hasOwnProperty(callback)) this.callbacks[callback](text)
        }

        return this
    }

    /**
     * Handle ajax error.
     *
     * @param response
     * @returns {SimpleEdit}
     */
    handleError(response = null) {
        if (response && this.error && typeof this.error === 'function') {
            // Call the given error function for custom error handling
            this.error(response)
        }

        // Remove spinner button
        $(this.pattern).find('button.loader').replaceWith(this.submitButton)
        $(this.pattern).find('button.submit').on('click', () => this.submit())

        // Add shake effect
        $(this.pattern).removeClass('simpleedit-error simpleedit-error-fade')
        $(this.pattern).addClass('simpleedit-error')
        setTimeout(() => {
            $(this.pattern).removeClass('simpleedit-error').addClass('simpleedit-error-fade')
            setTimeout(() => {
                $(this.pattern).removeClass('simpleedit-error-fade')
            }, 1000)
        }, 3000)

        return this
    }
}

/**
 * Find method by iterating over all available options.
 *
 * @param {string} method
 * @returns {string|boolean}
 */
function findMethod(method) {
    for (const [settingArrayKey, settingArray] of Object.entries($.fn.simpleedit.defaults.availableOptions)) {
        for (const setting in settingArray) {
            if (settingArray.hasOwnProperty(setting) && settingArray[setting] === method) return settingArrayKey
        }
    }

    return false
}