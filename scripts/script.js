// scripts/script.js
// Typing Effect with Intelligent Auto-Scrolling

document.addEventListener('DOMContentLoaded', () => {
    // Custom Mouse-Following Cursor
    const customCursor = document.querySelector('.custom-cursor');

    // Custom Cursor Movement
    document.addEventListener('mousemove', (e) => {
        customCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });

    // Streaming Text Effect with Sequential Typing
    const streamingElements = document.querySelectorAll('.content-section .streaming-text');
    let currentElement = 0;
    let autoScrollEnabled = true;

    /**
     * Splits the given text into chunks based on word length.
     * - Words ≤6 characters are added as whole.
     * - Words >6 characters are split into random chunks between 3-8 characters.
     * @param {string} text - The full text to split.
     * @returns {Array<string>} - An array of text chunks.
     */
    function splitTextIntoChunks(text) {
        const words = text.split(' ');
        const chunks = [];

        words.forEach(word => {
            if (word.length <= 6) {
                chunks.push(word + ' ');
            } else {
                let start = 0;
                while (start < word.length) {
                    const minChunk = 3;
                    const maxChunk = 8;
                    const remaining = word.length - start;
                    const randomChunkSize = Math.floor(Math.random() * (maxChunk - minChunk + 1)) + minChunk;
                    const chunkSize = Math.min(randomChunkSize, remaining);
                    const chunk = word.substring(start, start + chunkSize);
                    chunks.push(chunk);
                    start += chunkSize;
                }
                chunks.push(' '); // Add space after word
            }
        });

        return chunks;
    }

    /**
     * Types the given text into the specified element, handling chunk-based typing.
     * @param {HTMLElement} element - The element to type into.
     * @param {string} text - The full text to type.
     * @param {Function} callback - Function to call after typing is complete.
     */
    function typeText(element, text, callback) {
        const chunks = splitTextIntoChunks(text);
        let index = 0;
        const baseSpeed = 50; // Base typing speed in milliseconds per chunk

        // Initialize content with empty string and cursor
        element.innerHTML = '';

        const textNode = document.createTextNode('');
        const cursorSpan = document.createElement('span');
        cursorSpan.classList.add('typing-cursor');

        element.appendChild(textNode);
        element.appendChild(cursorSpan);

        const contentWrapper = document.querySelector('.content-wrapper');

        function typeChunk() {
            if (index < chunks.length) {
                const chunk = chunks[index];
                textNode.textContent += chunk;
                index++;

                // Auto-scroll to the bottom of the content wrapper if enabled
                if (autoScrollEnabled) {
                    contentWrapper.scrollTop = contentWrapper.scrollHeight;
                }

                // Calculate dynamic speed based on chunk length
                const dynamicSpeed = Math.max(baseSpeed - (chunk.length * 3), 20); // Faster typing for longer chunks
                setTimeout(typeChunk, dynamicSpeed);
            } else {
                // Remove cursor after typing is complete
                cursorSpan.remove();
                if (callback) callback();
            }
        }

        typeChunk();
    }

    /**
     * Starts the typing animation for all streaming text elements sequentially.
     */
    function startTyping() {
        if (currentElement >= streamingElements.length) return;

        const element = streamingElements[currentElement];
        const text = element.getAttribute('data-text') || element.textContent;

        typeText(element, text, () => {
            currentElement++;
            setTimeout(startTyping, 200); // Shorter delay between elements
        });
    }

    /**
     * Monitors user scrolling to enable or disable auto-scrolling.
     */
    function monitorScroll() {
        const contentWrapper = document.querySelector('.content-wrapper');

        contentWrapper.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = contentWrapper;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

            autoScrollEnabled = isAtBottom;
        });
    }

    // Initialize
    monitorScroll();
    startTyping();
});
