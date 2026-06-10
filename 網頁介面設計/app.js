/* ============================================
   DentAICare — Application Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ---- Navbar scroll effect ----
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active nav link based on scroll position
        const sections = ['hero', 'risk', 'guidance', 'toothmap'];
        let current = 'hero';
        for (const id of sections) {
            const el = document.getElementById(id);
            if (el && window.scrollY >= el.offsetTop - 200) {
                current = id;
            }
        }
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === current);
        });
    });

    // ---- Smooth scroll for nav links ----
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(link.dataset.section);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---- Animated counters ----
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        counters.forEach(counter => {
            const target = parseFloat(counter.dataset.target);
            const duration = 2000;
            const startTime = performance.now();
            const isFloat = target % 1 !== 0;

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = eased * target;

                if (isFloat) {
                    counter.textContent = current.toFixed(1);
                } else if (target >= 1000) {
                    counter.textContent = Math.floor(current).toLocaleString();
                } else {
                    counter.textContent = Math.floor(current);
                }

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }

            requestAnimationFrame(update);
        });
    }

    // Start counter animation when hero is visible
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                heroObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) heroObserver.observe(heroStats);

    // ---- Reveal on scroll ----
    const revealElements = document.querySelectorAll('.risk-card, .guidance-card, .toothmap-container');
    revealElements.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));

    // Stagger animation for risk cards
    const riskCards = document.querySelectorAll('.risk-card');
    const riskObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.parentElement.querySelectorAll('.risk-card');
                cards.forEach((card, i) => {
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, i * 100);
                });
                riskObserver.disconnect();
            }
        });
    }, { threshold: 0.1 });

    if (riskCards.length > 0) {
        riskObserver.observe(riskCards[0]);
    }

    // ---- Scan Modal ----
    const scanModal = document.getElementById('scanModal');
    const startScanBtn = document.getElementById('startScanBtn');
    const heroScanBtn = document.getElementById('heroScanBtn');
    const scanClose = document.getElementById('scanClose');
    const useDemo = document.getElementById('useDemo');
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    function openModal() {
        scanModal.classList.add('open');
        document.body.style.overflow = 'hidden';
        resetScan();
    }

    function closeModal() {
        scanModal.classList.remove('open');
        document.body.style.overflow = '';
    }

    function resetScan() {
        document.querySelectorAll('.scan-step').forEach(s => s.classList.remove('active'));
        document.getElementById('step1').classList.add('active');
    }

    startScanBtn.addEventListener('click', openModal);
    heroScanBtn.addEventListener('click', openModal);
    scanClose.addEventListener('click', closeModal);
    scanModal.querySelector('.scan-modal-overlay').addEventListener('click', closeModal);

    // Upload zone interactions
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        startAnalysis();
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            startAnalysis();
        }
    });

    // Demo button
    useDemo.addEventListener('click', () => {
        startAnalysis();
    });

    // ---- Analysis Simulation ----
    function startAnalysis() {
        // Switch to step 2
        document.querySelectorAll('.scan-step').forEach(s => s.classList.remove('active'));
        document.getElementById('step2').classList.add('active');

        const progressRing = document.querySelector('.progress-ring');
        const percentText = document.querySelector('.analyzing-percent');
        const circumference = 339.292;
        const steps = document.querySelectorAll('.analyzing-step-item');
        const stepMilestones = [25, 50, 75, 100];

        let progress = 0;
        let currentStep = 0;

        // Reset
        progressRing.style.strokeDashoffset = circumference;
        steps.forEach(s => { s.classList.remove('active', 'done'); });

        const interval = setInterval(() => {
            progress += 1;
            const offset = circumference - (progress / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
            percentText.textContent = progress + '%';

            // Activate steps
            if (currentStep < stepMilestones.length) {
                if (progress >= stepMilestones[currentStep] - 24 && !steps[currentStep].classList.contains('active')) {
                    steps[currentStep].classList.add('active');
                }
                if (progress >= stepMilestones[currentStep]) {
                    steps[currentStep].classList.remove('active');
                    steps[currentStep].classList.add('done');
                    currentStep++;
                }
            }

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    document.querySelectorAll('.scan-step').forEach(s => s.classList.remove('active'));
                    document.getElementById('step3').classList.add('active');
                }, 500);
            }
        }, 40);
    }

    // View guidance button in results
    const viewGuidance = document.getElementById('viewGuidance');
    if (viewGuidance) {
        viewGuidance.addEventListener('click', () => {
            closeModal();
            setTimeout(() => {
                document.getElementById('guidance').scrollIntoView({ behavior: 'smooth' });
            }, 300);
        });
    }

    // "Learn more" button
    const heroLearnBtn = document.getElementById('heroLearnBtn');
    if (heroLearnBtn) {
        heroLearnBtn.addEventListener('click', () => {
            document.getElementById('risk').scrollIntoView({ behavior: 'smooth' });
        });
    }

    // ---- Interactive Tooth Map ----
    const teeth = document.querySelectorAll('.tooth');
    const toothDetail = document.getElementById('toothDetail');
    const detailContent = document.getElementById('detailContent');
    const detailPlaceholder = toothDetail.querySelector('.detail-placeholder');

    const toothData = {
        normal: {
            statusText: '健康',
            risk: '低',
            advice: '維持日常清潔即可',
            brushing: '請使用軟毛牙刷，以 45 度角輕柔刷洗牙齦線，每次至少刷 2 分鐘。',
            badgeClass: '',
            badgeText: '正常'
        },
        debris: {
            statusText: '有食物殘渣',
            risk: '低',
            advice: '加強使用牙線清潔',
            brushing: '此區域牙縫較容易卡食物殘渣，建議每餐後使用牙線或牙間刷仔細清潔。特別注意此牙齒與相鄰牙齒之間的縫隙。',
            badgeClass: 'debris',
            badgeText: '食物殘渣'
        },
        tartar: {
            statusText: '牙結石堆積',
            risk: '中',
            advice: '建議預約洗牙',
            brushing: '此區域有明顯牙結石堆積，日常刷牙無法有效清除已形成的結石。建議預約牙科洗牙，並在日後加強此區域的刷牙力度，預防結石再次形成。',
            badgeClass: 'tartar',
            badgeText: '牙結石'
        },
        caution: {
            statusText: '需觀察追蹤',
            risk: '中低',
            advice: '定期自我檢查並追蹤變化',
            brushing: '此牙齒目前狀況需持續觀察。建議每天認真清潔此區域，使用含氟牙膏，並在下次就診時主動告知牙醫此區域的狀況。',
            badgeClass: 'caution',
            badgeText: '需留意'
        },
        warning: {
            statusText: '輕度異常',
            risk: '中高',
            advice: '建議兩週內就醫檢查',
            brushing: '此牙齒偵測到輕度異常徵兆，可能為早期齲齒或牙齦問題。建議溫和刷洗避免過度施力，並使用含氟漱口水加強防護。盡快預約牙醫進行專業檢查。',
            badgeClass: 'warning',
            badgeText: '輕度風險'
        },
        danger: {
            statusText: '疑似齲齒',
            risk: '高',
            advice: '盡速就醫治療',
            brushing: '此牙齒偵測到疑似齲齒病變，需要專業牙醫進一步確認及治療。在就醫前，請保持該區域清潔但避免過度刺激，減少甜食攝取。請盡快預約牙科就診。',
            badgeClass: 'danger',
            badgeText: '高度風險'
        },
        periodontal: {
            statusText: '疑似牙周病',
            risk: '嚴重',
            advice: '立即預約牙周專科',
            brushing: '此區域偵測到疑似牙周病徵兆，包括可能的牙齦萎縮和牙周袋加深。請立即預約牙周專科醫師進行詳細檢查。在就醫前，使用軟毛牙刷輕柔清潔，避免用力過猛導致牙齦進一步受損。',
            badgeClass: 'periodontal',
            badgeText: '牙周病'
        }
    };

    teeth.forEach(tooth => {
        tooth.addEventListener('click', () => {
            // Remove previous selection
            teeth.forEach(t => t.classList.remove('selected'));
            tooth.classList.add('selected');

            const id = tooth.dataset.id;
            const name = tooth.dataset.name;
            const status = tooth.dataset.status;
            const data = toothData[status] || toothData.normal;

            // Update detail panel
            document.getElementById('detailId').textContent = '#' + id;
            document.getElementById('detailName').textContent = name;
            document.getElementById('detailStatusText').textContent = data.statusText;
            document.getElementById('detailRisk').textContent = data.risk;
            document.getElementById('detailAdvice').textContent = data.advice;
            document.getElementById('detailBrushingText').textContent = data.brushing;

            const badge = document.getElementById('detailStatusBadge');
            badge.textContent = data.badgeText;
            badge.className = 'detail-status-badge ' + data.badgeClass;

            detailPlaceholder.style.display = 'none';
            detailContent.style.display = 'block';
            detailContent.style.animation = 'fadeInUp 0.3s ease-out';
        });
    });

    // ---- Risk card hover effects ----
    riskCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.querySelector('.card-glow').style.background = 
                `radial-gradient(circle at ${x}% ${y}%, rgba(59, 130, 246, 0.06), transparent 60%)`;
        });
    });

    // ---- Tooth 3D hover tilt effect ----
    const tooth3d = document.getElementById('tooth3d');
    if (tooth3d) {
        tooth3d.addEventListener('mousemove', (e) => {
            const rect = tooth3d.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            const toothInner = tooth3d.querySelector('.tooth-3d');
            toothInner.style.transform = `rotateY(${x * 15}deg) rotateX(${-y * 15}deg)`;
        });

        tooth3d.addEventListener('mouseleave', () => {
            const toothInner = tooth3d.querySelector('.tooth-3d');
            toothInner.style.transform = 'rotateY(0deg) rotateX(0deg)';
            toothInner.style.transition = 'transform 0.5s ease-out';
            setTimeout(() => {
                toothInner.style.transition = '';
            }, 500);
        });
    }

    // ---- Alert card interactions ----
    document.querySelectorAll('.alert-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const text = btn.textContent;
            btn.textContent = '✓ 已設定';
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
            setTimeout(() => {
                btn.textContent = text;
                btn.style.opacity = '';
                btn.style.pointerEvents = '';
            }, 2000);
        });
    });

    // ---- Keyboard accessibility ----
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && scanModal.classList.contains('open')) {
            closeModal();
        }
    });

    // ---- Guidance alert card shimmer on scroll ----
    const guidanceAlertCard = document.getElementById('guidance-alert');
    if (guidanceAlertCard) {
        const alertObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate alerts sequentially
                    const alerts = guidanceAlertCard.querySelectorAll('.alert-card');
                    alerts.forEach((alert, i) => {
                        alert.style.opacity = '0';
                        alert.style.transform = 'translateX(-20px)';
                        setTimeout(() => {
                            alert.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
                            alert.style.opacity = '1';
                            alert.style.transform = 'translateX(0)';
                        }, 200 + i * 200);
                    });
                    alertObserver.disconnect();
                }
            });
        }, { threshold: 0.2 });

        alertObserver.observe(guidanceAlertCard);
    }

});
