document.addEventListener('DOMContentLoaded', () => {
    const startTimeInput = document.getElementById('start-time');
    const shiftHoursInput = document.getElementById('shift-hours');
    const shiftHOnlyInput = document.getElementById('shift-h-only');
    const shiftMOnlyInput = document.getElementById('shift-m-only');
    const breakMinutesInput = document.getElementById('break-minutes');
    const calculateBtn = document.getElementById('calculate-btn');
    const finishTimeDisplay = document.getElementById('finish-time');
    const countdownText = document.getElementById('countdown-text');

    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const decimalContainer = document.getElementById('decimal-input-container');
    const hrMinContainer = document.getElementById('hrmin-input-container');

    let shiftMode = 'decimal'; // 'decimal' or 'hrmin'

    // Set default values
    startTimeInput.value = "08:45";
    shiftHoursInput.value = 8;
    shiftHOnlyInput.value = 8;
    shiftMOnlyInput.value = 0;
    breakMinutesInput.value = 60;

    // Toggle Mode Logic
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const oldMode = shiftMode;
            shiftMode = btn.dataset.type;

            if (oldMode === shiftMode) return;

            // UI Toggle
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Translate values between modes
            if (shiftMode === 'decimal') {
                decimalContainer.classList.remove('hidden');
                hrMinContainer.classList.add('hidden');

                // Translate Hr/Min to Decimal
                const h = parseFloat(shiftHOnlyInput.value) || 0;
                const m = parseFloat(shiftMOnlyInput.value) || 0;
                const decimal = h + (m / 60);
                shiftHoursInput.value = Math.round(decimal * 100) / 100; // Round to 2 decimal places
            } else {
                decimalContainer.classList.add('hidden');
                hrMinContainer.classList.remove('hidden');

                // Translate Decimal to Hr/Min
                const decimal = parseFloat(shiftHoursInput.value) || 0;
                const h = Math.floor(decimal);
                const m = Math.round((decimal - h) * 60);
                shiftHOnlyInput.value = h;
                shiftMOnlyInput.value = m;
            }

            calculateClockOut();
        });
    });

    let currentStartDate = null;
    let currentEndDate = null;

    function calculateClockOut() {
        const startTime = startTimeInput.value;
        const breakMinutes = parseFloat(breakMinutesInput.value) || 0;

        if (!startTime) return;

        let totalShiftMs = 0;
        if (shiftMode === 'decimal') {
            const shiftHours = parseFloat(shiftHoursInput.value) || 0;
            totalShiftMs = shiftHours * 60 * 60 * 1000;
        } else {
            const h = parseFloat(shiftHOnlyInput.value) || 0;
            const m = parseFloat(shiftMOnlyInput.value) || 0;
            totalShiftMs = (h * 60 * 60 * 1000) + (m * 60 * 1000);
        }
        // Parse start time
        const [startH, startM] = startTime.split(':').map(Number);

        // Create a date object for today at start time
        const date = new Date();
        date.setHours(startH, startM, 0, 0);

        // Add break minutes
        const breakInMs = breakMinutes * 60 * 1000;

        const clockOutDate = new Date(date.getTime() + totalShiftMs + breakInMs);
        currentStartDate = date;
        currentEndDate = clockOutDate;

        // Format the output
        let outHours = clockOutDate.getHours();
        const outMinutes = String(clockOutDate.getMinutes()).padStart(2, '0');
        const ampm = outHours >= 12 ? 'PM' : 'AM';

        outHours = outHours % 12;
        outHours = outHours ? outHours : 12; // Handle midnight (0) as 12

        const formattedTime = `${outHours}:${outMinutes} ${ampm}`;

        // Update UI with animation
        finishTimeDisplay.style.opacity = '0';
        setTimeout(() => {
            finishTimeDisplay.textContent = formattedTime;
            finishTimeDisplay.style.opacity = '1';
            updateCountdown(currentEndDate);
            updateBubuGif(currentStartDate, currentEndDate);
        }, 150);
    }

    function updateBubuGif(startDate, endDate) {
        if (!startDate || !endDate) return;
        const bubuGif = document.getElementById('bubu-gif');
        const now = new Date();
        const oneHourMs = 60 * 60 * 1000;

        let gifPath = 'assets/gifs/bubu_sleeping.gif';

        if (now >= startDate && now <= endDate) {
            // Randomly pick between working and working_eating for variety
            // We use the hour to determine which working gif to show so it doesn't flicker every second
            gifPath = (now.getHours() % 2 === 0)
                ? 'assets/gifs/bubu_working_eating.gif'
                : 'assets/gifs/bubu_working.gif';
        } else if (
            (now >= new Date(startDate.getTime() - oneHourMs) && now < startDate) ||
            (now > endDate && now <= new Date(endDate.getTime() + oneHourMs))
        ) {
            gifPath = 'assets/gifs/bubu_travel.gif';
        } else {
            gifPath = 'assets/gifs/bubu_sleeping.gif';
        }

        // Only update if path changed to prevent flashing
        if (bubuGif.src.indexOf(gifPath) === -1) {
            bubuGif.src = gifPath;
        }
    }

    function updateCountdown(targetDate) {
        if (!targetDate) return;
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
            countdownText.textContent = "Bubu should be off work now!";
            countdownText.style.color = "#10b981"; // Emerald green
        } else {
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            let timeStr = "";
            if (h > 0) timeStr += `${h}h `;
            timeStr += `${m}m remaining`;

            countdownText.textContent = timeStr;
            countdownText.style.color = "var(--primary)";
        }
    }

    // Update every minute to keep countdown and GIF current
    setInterval(() => {
        if (currentEndDate) {
            updateCountdown(currentEndDate);
            updateBubuGif(currentStartDate, currentEndDate);
        }
    }, 60000);

    // Event Listeners
    calculateBtn.addEventListener('click', calculateClockOut);

    // Also calculate whenever inputs change for a live feel
    [startTimeInput, shiftHoursInput, shiftHOnlyInput, shiftMOnlyInput, breakMinutesInput].forEach(input => {
        input.addEventListener('input', calculateClockOut);
    });

    // Initial calculation
    calculateClockOut();
});
