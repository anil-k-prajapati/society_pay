// ==========================================
// CONFIGURATION BLOCK - EDIT VALUES BELOW
// ==========================================
const CONFIG = {
    society_name: "Terra Gold - Belmac Riverside",
    upi_id: "terragold.belmac@upi",
    maintenance_amount: 2500,
    currency: "INR"
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
    societyNameDisplay.innerHTML = `${CONFIG.society_name} <span style="font-size: 1.15rem;">🏢</span>`;
    amountDisplay.textContent = `${CONFIG.currency} ${Number(CONFIG.maintenance_amount).toLocaleString('en-IN')}`;

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
    function getTransactionNote() {
        const flat = flatSelect.value;
        const month = monthSelect.value;
        const year = yearSelect.value;
        
        if (!flat || !month || !year) return "";
        
        let tn = `Flat-${flat}-${month}-${year}-Maintenance`;
        
        // Progressive shortening algorithm to fit 50-character limit
        if (tn.length > 50) {
            tn = `Flat-${flat}-${month}-${year}-Maint`;
        }
        if (tn.length > 50) {
            tn = `Fl-${flat}-${month}-${year}-Maint`;
        }
        if (tn.length > 50) {
            // Hard limit: truncate flat identifier if abnormally long
            const maxFlatLength = 50 - `Fl--${month}-${year}-Maint`.length;
            const truncatedFlat = flat.substring(0, maxFlatLength);
            tn = `Fl-${truncatedFlat}-${month}-${year}-Maint`;
        }
        
        return tn;
    }

    function getUpiLink(tn) {
        const pa = CONFIG.upi_id;
        const pn = encodeURIComponent(CONFIG.society_name);
        const am = CONFIG.maintenance_amount;
        const cu = CONFIG.currency;
        const encodedTn = encodeURIComponent(tn);
        
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

    document.getElementById('copy-btn').addEventListener('click', () => {
        const tn = getTransactionNote();
        if (!tn) return;
        
        const link = getUpiLink(tn);
        navigator.clipboard.writeText(link).then(() => {
            const btn = document.getElementById('copy-btn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = "✅ Copied";
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
        
        const text = `I have paid maintenance for Flat ${flat} - ${monthName} ${year}. Please find the payment details: [UPI Ref will show in your bank statement]`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    });

    // Start with flats disabled until floor is selected
    flatSelect.disabled = true;
});
