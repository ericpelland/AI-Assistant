// Keep track of the current tooltip element
let currentTooltip = null

const removeTooltip = () => {
    // Remove the current tooltip element, if there is one
    if (currentTooltip) {
        document.body.removeChild(currentTooltip)
        currentTooltip = null
    }
}

const addLoadingIcon = (tooltip) => {
    // Create a loading element
    let loadingElement = document.createElement("div")
    loadingElement.classList.add("loading-ai-tooltip")

    // Add a spinner animation to the loading element
    let spinner = document.createElement("div")
    spinner.classList.add("spinner-ai-tooltip")
    loadingElement.appendChild(spinner)

    // Add the loading element to the tooltip
    tooltip.appendChild(loadingElement)
}

const handleRetryButtonClick = () => {
    chrome.runtime.sendMessage({ retry: true })
}


const createButton = (text, callback) => {
    let button = document.createElement("button")
    button.innerText = text
    button.onclick = callback
    return button
}

const addButtons = (tooltip, apiResult) => {
    let retryButton = createButton("Retry", handleRetryButtonClick)
    let copyButton = createButton("Copy", () => { navigator.clipboard.writeText(apiResult) })

    tooltip.appendChild(copyButton)
    tooltip.appendChild(retryButton)
}

const addTooltip = (apiResult) => {
    let tooltip = document.createElement("div")
    tooltip.classList.add("ai-tooltip")

    if (apiResult == 'loading') {
        addLoadingIcon(tooltip)
    } else {
        tooltip.innerText = apiResult
        addButtons(tooltip, apiResult)
    }

    document.body.appendChild(tooltip)
    currentTooltip = tooltip
    adjustTooltipPosition()
}

const adjustTooltipPosition = () => {
    if (!currentTooltip) {
        return
    }

    let rect = window.getSelection().getRangeAt(0).getBoundingClientRect()
    currentTooltip.style.cssText = "top: " + rect.bottom + "px !important; left: " + rect.left + "px !important;"
}

const handleAPIResult = (apiResult) => {
    removeTooltip()
    addTooltip(apiResult)
}

const messageHandler = (message) => {
    if (message.hasOwnProperty("removeTooltip")) {
        removeTooltip()
    } else {
        console.log(message)
        handleAPIResult(message.apiResult.trim())
    }
}

const sendRuntimeMessage = () => {
    let selectedText = window.getSelection().toString()
    chrome.runtime.sendMessage({ selectedText: selectedText })
}

const debounce = (func, wait) => {
    let timeout
    return (...args) => {
        const later = () => {
            timeout = null
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

const handleScroll = () => {
    setTimeout(adjustTooltipPosition, 300)
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(messageHandler)

// Create a debounced version of the event listener
let debouncedSendRuntimeMessage = debounce(sendRuntimeMessage, 250)

// Add the debounced event listener
document.addEventListener("selectionchange", debouncedSendRuntimeMessage)

// Fix the position of the tooltip when the page is scrolled
window.addEventListener("wheel", handleScroll)