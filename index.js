const ANALYTICS_ID = 'G-VCL644R1SZ';
const CONSENT_STORAGE_KEY = 'kudosCookieConsent';

function getStoredConsent() {
    try {
        return localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch (error) {
        return null;
    }
}

function storeConsent(value) {
    try {
        localStorage.setItem(CONSENT_STORAGE_KEY, value);
    } catch (error) {
        // ignore storage errors in private browsing
    }
}

function applyAnalyticsPreference(consentValue) {
    const shouldDisable = consentValue !== 'accepted';
    window[`ga-disable-${ANALYTICS_ID}`] = shouldDisable;
}

applyAnalyticsPreference(getStoredConsent());

$(document).ready(function(){
     showAll();
     $('#inputarticle').on('input', function(){
          let sentence = $(this).val().toLowerCase();

          let titles = document.getElementsByClassName("card-title");
          let divs = $('.myDivs');
          showAll();
               for(let i = 0; i < divs.length; i++){

                    let div = divs[i];
                    let title = titles[i].innerText.toLowerCase();


                    if(title.includes(sentence))
                        $(div).show();
                    else
                        $(div).hide();

          }
     });
     function showAll(){
          let divs = $('.myDivs');
          for(let i = 0; i < divs.length; i++){
               let div = divs[i];
               $(div).show();
          }
     }
});

document.addEventListener('DOMContentLoaded', function () {
    initializeNewsletterForms();
    initializeCookieBanner();
    updateCopyrightYear();
});

function initializeNewsletterForms() {
    const forms = document.querySelectorAll('[data-newsletter-form]');
    forms.forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const inputId = form.getAttribute('data-newsletter-form');
            subscribeToNewsletter(inputId, form);
        });
    });
}

function subscribeToNewsletter(inputId, formElement) {
    const input = document.getElementById(inputId);
    if (!input) {
        return;
    }
    const emailValue = input.value.trim();
    if (!emailValue) {
        alert('Please enter a valid email address.');
        return;
    }

    if (typeof emailjs === 'undefined') {
        alert('Newsletter service is temporarily unavailable. Please try again later.');
        return;
    }

    const templateParams = {
        from_name: 'New Kudos AI subscriber',
        message: emailValue,
    };

    formElement.classList.add('is-loading');

    emailjs
        .send('service_k1ob3bf', 'template_nh74jz8', templateParams)
        .then(() => {
            input.value = '';
            alert('Thank you for subscribing to Kudos AI!');
        })
        .catch(() => {
            alert('Please confirm the captcha and try again.');
        })
        .finally(() => {
            formElement.classList.remove('is-loading');
        });
}

function initializeCookieBanner() {
    const consentValue = getStoredConsent();
    if (consentValue === 'accepted' || consentValue === 'declined') {
        return;
    }

    const banner = document.createElement('section');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML = `
        <p>We use a privacy-friendly analytics setup to understand readership. Cookies for measurement and personalized ads only load after you consent. Review our <a href="/Privacy-Policy.html" class="text-link">Privacy Policy</a> and <a href="/Cookie-Policy.html" class="text-link">Cookie Policy</a>.</p>
        <div class="cookie-banner__actions">
            <button class="cookie-banner__btn cookie-banner__btn--primary" data-consent-choice="accept">Accept and continue</button>
            <button class="cookie-banner__btn cookie-banner__btn--ghost" data-consent-choice="decline">Decline optional cookies</button>
        </div>
    `;

    document.body.appendChild(banner);

    banner.querySelectorAll('[data-consent-choice]').forEach(button => {
        button.addEventListener('click', function (event) {
            const choice = event.target.getAttribute('data-consent-choice');
            storeConsent(choice === 'accept' ? 'accepted' : 'declined');
            applyAnalyticsPreference(choice === 'accept' ? 'accepted' : 'declined');
            banner.remove();
        });
    });
}

function updateCopyrightYear() {
    const targets = document.querySelectorAll('.js-copyright-year');
    if (!targets.length) {
        return;
    }
    const currentYear = new Date().getFullYear();
    const displayYear = Math.max(currentYear, 2025);
    targets.forEach((node) => {
        node.textContent = displayYear;
    });
}

function GetInTouch() {

var templateParams = {
    fname: document.getElementById("fname").value,
    lname: document.getElementById("lname").value,
    subject: document.getElementById("subject").value,
    mail: document.getElementById("mail").value,
    message: document.getElementById("message").value,

};

emailjs.send('service_k1ob3bf', 'template_lmbrfrb', templateParams )
    .then((res) => {

alert("Your message was sent to Anas!");

       document.getElementById("fname").value="";
document.getElementById("lname").value="";
document.getElementById("subject").value="";
document.getElementById("mail").value="";
document.getElementById("message").value="";
    })
.catch((err) => alert("Please fill the captcha!"));
};


function onSubmit(token) {
         document.getElementById("subs").submit();
       };
