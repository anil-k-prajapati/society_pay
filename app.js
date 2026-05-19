// ==========================================
// CONFIGURATION BLOCK - EDIT VALUES BELOW
// ==========================================
const CONFIG = {
    society_name: "Terra Gold - Belmac Riverside",
    upi_id: "anil.personal.me-1@okicici",
    maintenance_amount: 1,
    currency: "₹"
};
// ==========================================
// END CONFIGURATION BLOCK
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const societyNameDisplay = document.getElementById('society-name-display');
    const amountDisplay = document.getElementById('amount-display');
    const floorSelect = document.getElementById('floor');
    const flatSelect = document.getElementById('flat');
    const monthSelect = document.getElementById('month');
    const yearSelect = document.getElementById('year');
    const paymentSection = document.getElementById('payment-section');
    const payBtn = document.getElementById('pay-btn');
    const qrcodeContainer = document.getElementById('qrcode-container');
    const tabPay = document.getElementById('tab-pay');
    const tabQr = document.getElementById('tab-qr');
    const tabContentPay = document.getElementById('tab-content-pay');
    const tabContentQr = document.getElementById('tab-content-qr');

    // Initialize display metadata
    societyNameDisplay.textContent = CONFIG.society_name;
    amountDisplay.textContent = `${CONFIG.currency}${Number(CONFIG.maintenance_amount).toLocaleString('en-IN')}`;

    // Populate Floor (1 to 6)
    for (let f = 1; f <= 6; f++) {
        const opt = document.createElement('option');
        opt.value = f;
        opt.textContent = `${f}${getOrdinalSuffix(f)} Floor`;
        floorSelect.appendChild(opt);
    }

    // Populate Months
    const months = [
        { val: "Jan", name: "January" }, { val: "Feb", name: "February" },
        { val: "Mar", name: "March" },   { val: "Apr", name: "April" },
        { val: "May", name: "May" },     { val: "Jun", name: "June" },
        { val: "Jul", name: "July" },    { val: "Aug", name: "August" },
        { val: "Sep", name: "September" },{ val: "Oct", name: "October" },
        { val: "Nov", name: "November" }, { val: "Dec", name: "December" }
    ];
    months.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.val;
        opt.textContent = m.name;
        monthSelect.appendChild(opt);
    });

    // Populate Years
    const currentYear = new Date().getFullYear();
    [currentYear, currentYear + 1].forEach(year => {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        yearSelect.appendChild(opt);
    });

    // Set Defaults
    const currentMonthIndex = new Date().getMonth();
    monthSelect.selectedIndex = currentMonthIndex + 1; // skip disabled placeholder
    yearSelect.value = currentYear;

    // Helper: Ordinal suffix generator
    function getOrdinalSuffix(i) {
        let j = i % 10, k = i % 100;
        if (j == 1 && k != 11) return "st";
        if (j == 2 && k != 12) return "nd";
        if (j == 3 && k != 13) return "rd";
        return "th";
    }

    // Dynamic Flats Generator based on floor
    function populateFlats(floor) {
        flatSelect.innerHTML = '<option value="" disabled selected>Flat No</option>';
        if (!floor) {
            flatSelect.disabled = true;
            return;
        }
        
        flatSelect.disabled = false;
        // Each floor has 10 flats (e.g. Floor 1: 101 to 110, Floor 6: 601 to 610)
        const base = floor * 100;
        for (let i = 1; i <= 10; i++) {
            const flatNum = base + i;
            const opt = document.createElement('option');
            opt.value = flatNum;
            opt.textContent = flatNum;
            flatSelect.appendChild(opt);
        }
    }

    // Device View Tuning (Mobile vs Desktop) - Set initial Tab
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    function switchTab(activeTab) {
        if (activeTab === 'pay') {
            tabPay.classList.add('active');
            tabQr.classList.remove('active');
            tabContentPay.style.display = 'block';
            tabContentQr.style.display = 'none';
        } else {
            tabQr.classList.add('active');
            tabPay.classList.remove('active');
            tabContentPay.style.display = 'none';
            tabContentQr.style.display = 'block';
        }
    }
    
    // Set initial state: direct pay default on all devices
    switchTab('pay');

    // Tab Listeners
    tabPay.addEventListener('click', () => switchTab('pay'));
    tabQr.addEventListener('click', () => switchTab('qr'));

    // Core Logic
    // NPCI Compliance: transaction note must be alphanumeric + spaces only,
    // max 50 characters. Hyphens & special chars can cause PSP rejection.
    function getTransactionNote() {
        const flat = flatSelect.value;
        const month = monthSelect.value;
        const year = yearSelect.value;
        
        if (!flat || !month || !year) return "";
        
        // Convert 4-digit year (e.g. 2026) to 2-digit (e.g. 26)
        const shortYear = year.toString().slice(-2);
        
        // Short form format: F101 May 26 Mnt
        let tn = `F${flat} ${month} ${shortYear} Mnt`;
        
        // Final safety: strip any remaining non-alphanumeric chars except spaces
        tn = tn.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 50).trim();
        
        return tn;
    }

    function getUpiLink(tn) {
        const pa = CONFIG.upi_id;
        // NPCI: payee name must be properly URI-encoded
        const pn = encodeURIComponent(CONFIG.society_name);
        // NPCI: amount must be a decimal string (e.g. "1.00"), not an integer
        const am = Number(CONFIG.maintenance_amount).toFixed(2);
        const cu = CONFIG.currency;
        const encodedTn = encodeURIComponent(tn);
        
        // NPCI / Security Note: The `ru` (Return URL) parameter is intentionally
        // OMITTED. NPCI's 2024-2025 security framework flags third-party `ru`
        // redirects as a phishing vector. PSP apps (GPay, PhonePe, BHIM etc.)
        // block or silently drop deep links containing unverified `ru` domains.
        // Fallback detection is handled via the browser's visibilitychange event.
        return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&tn=${encodedTn}&cu=${cu}`;
    }

    let qrCodeObj = null;
    function generateQR(link) {
        const container = document.getElementById('qrcode');
        container.innerHTML = "";
        
        if (typeof QRCode === 'undefined') {
            container.innerHTML = "<p style='color:#ef4444; font-size:0.875rem; text-align:center; padding: 2rem 1rem;'>QR Code failed to load.<br>Please use the Copy Link feature.</p>";
            return;
        }
        
        try {
            qrCodeObj = new QRCode(container, {
                text: link,
                width: 250,
                height: 250,
                colorDark : "#09090b",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.M
            });
        } catch(e) {
            console.error("QR Rendering Failed:", e);
        }
    }

    function updateUI() {
        const tn = getTransactionNote();
        
        if (tn) {
            const upiLink = getUpiLink(tn);
            payBtn.href = upiLink;
            payBtn.classList.remove('disabled');
            generateQR(upiLink);
            paymentSection.classList.add('active');
        } else {
            paymentSection.classList.remove('active');
            payBtn.removeAttribute('href');
            payBtn.classList.add('disabled');
        }
    }

    // Event hooks
    floorSelect.addEventListener('change', (e) => {
        populateFlats(e.target.value);
        updateUI();
    });
    
    flatSelect.addEventListener('change', updateUI);
    monthSelect.addEventListener('change', updateUI);
    yearSelect.addEventListener('change', updateUI);

    // Save payment context to sessionStorage when Pay Now is tapped
    // sessionStorage is cleared automatically when the browser session ends,
    // which is safer than localStorage for transient payment state.
    payBtn.addEventListener('click', () => {
        const flat = flatSelect.value;
        const monthName = monthSelect.options[monthSelect.selectedIndex].text;
        const year = yearSelect.value;
        if (flat && monthName && year) {
            sessionStorage.setItem('payment_pending', JSON.stringify({
                flat: flat,
                month: monthName,
                year: year,
                ts: Date.now()  // timestamp to expire stale state
            }));
        }
    });

    // NPCI-safe fallback: detect return from UPI app via visibilitychange.
    // When the user switches to the UPI app and comes back to the browser,
    // the page becomes visible again. We check for a pending payment state
    // and show the congratulations modal — no `ru` redirect required.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        
        const raw = sessionStorage.getItem('payment_pending');
        if (!raw) return;
        
        let pending;
        try { pending = JSON.parse(raw); } catch(e) { return; }
        
        // Only act if the pending state is fresh (within 10 minutes)
        const AGE_LIMIT_MS = 10 * 60 * 1000;
        if (!pending.ts || (Date.now() - pending.ts) > AGE_LIMIT_MS) {
            sessionStorage.removeItem('payment_pending');
            return;
        }
        
        // Clear immediately so repeat tab-switches don't re-trigger
        sessionStorage.removeItem('payment_pending');
        
        showSuccessModal(pending);
    });

    function showSuccessModal(payment) {
        const modal = document.getElementById('success-modal');
        const modalText = document.getElementById('success-modal-text');
        const modalWaBtn = document.getElementById('modal-wa-btn');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        
        modalText.textContent = `Thank you for initiating your maintenance payment of ₹${Number(CONFIG.maintenance_amount).toLocaleString('en-IN')} for Flat ${payment.flat} (${payment.month} ${payment.year}). Please verify the transaction was authorized in your UPI app.`;
        
        modalWaBtn.onclick = () => {
            const text = `Maintenance payment initiated for Flat ${payment.flat} ${payment.month} ${payment.year}. Amount: ₹${CONFIG.maintenance_amount}. Ref will appear on bank statement.`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        };
        
        modal.style.display = 'flex';
        
        modalCloseBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }

    document.getElementById('copy-btn').addEventListener('click', () => {
        const tn = getTransactionNote();
        if (!tn) return;
        
        const link = getUpiLink(tn);
        navigator.clipboard.writeText(link).then(() => {
            const btn = document.getElementById('copy-btn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = "Copied";
            setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
        }).catch(() => {
            alert("Could not copy link automatically.");
        });
    });

    document.getElementById('wa-btn').addEventListener('click', () => {
        const flat = flatSelect.value;
        const monthName = monthSelect.options[monthSelect.selectedIndex].text;
        const year = yearSelect.value;
        
        if (!flat) return;
        
        const text = `Maintenance payment initiated for Flat ${flat} ${monthName} ${year}. Amount: ₹${CONFIG.maintenance_amount}. Ref will appear on bank statement.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    });

    // Start with flats disabled until floor is selected
    flatSelect.disabled = true;
});
