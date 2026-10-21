let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let currentUserId = null;
let isLoadingCloudData = false;
let cloudSaveTimer = null;
let cloudSyncInProgress = false;

/* =========================================
   BUDGETBULL EXPENSE TRACKER
========================================= */


/* =========================================
   DATA
========================================= */

let budget = 20000;

let expenses = [];



/* =========================================
   DOM
========================================= */

const expenseModal =
    document.getElementById("expenseModal");

const budgetModal =
    document.getElementById("budgetModal");

const categoryDetails =
    document.getElementById("categoryDetails");

const categoryExpenseList =
    document.getElementById("categoryExpenseList");



/* =========================================
   DATE
========================================= */

const today = new Date();

document.getElementById("todayDate")
    .textContent =
    today.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );



/* =========================================
   MONEY
========================================= */

function money(value) {

    return "₹" +
        Number(value)
            .toLocaleString("en-IN");

}



/* =========================================
   TOTAL
========================================= */

function getTotal() {

    return expenses.reduce(
        (sum, expense) =>
            sum + expense.amount,
        0
    );

}



/* =========================================
   CATEGORY TOTAL
========================================= */

function getCategoryTotal(category) {

    return expenses

        .filter(
            expense =>
                expense.category === category
        )

        .reduce(
            (sum, expense) =>
                sum + expense.amount,
            0
        );

}



/* =========================================
   UPDATE EVERYTHING
========================================= */

function updateDashboard() {

    const total =
        getTotal();


    const remaining =
        Math.max(
            budget - total,
            0
        );


    const percent =
        budget > 0
            ? (total / budget) * 100
            : 0;


    /* Budget */

    document.getElementById(
        "budgetAmount"
    ).textContent =
        money(budget);


    document.getElementById(
        "totalExpenses"
    ).textContent =
        money(total);


    document.getElementById(
        "remainingAmount"
    ).textContent =
        money(remaining);


    document.getElementById(
        "percentageUsed"
    ).textContent =
        percent.toFixed(1) + "%";


    document.getElementById(
        "budgetProgress"
    ).style.width =
        Math.min(percent, 100) + "%";


    document.getElementById(
        "budgetUsedText"
    ).textContent =
        percent.toFixed(1) + "% used";


    document.getElementById(
        "budgetRemainingText"
    ).textContent =
        money(remaining) +
        " remaining";


    /* Analysis */

    document.getElementById(
        "analysisSpent"
    ).textContent =
        money(total);


    document.getElementById(
        "analysisAvailable"
    ).textContent =
        money(remaining);


    document.getElementById(
        "donutTotal"
    ).textContent =
        money(total);


    /* Categories */

    updateCategories(total);


    /* Donut */

    updateDonut(total);


    /* Recent expenses */

    renderExpenses();


    /* Tip */

    updateTip(percent);

    // Keep the additive advanced panels in sync with the existing tracker.
    if (window.BUDGETBULL_ADVANCED_REFRESH) window.BUDGETBULL_ADVANCED_REFRESH();
    scheduleCloudSave();

}



/* =========================================
   CATEGORIES
========================================= */

function updateCategories(total) {

    const categories = [

        "Food",
        "Travel",
        "Entertainment",
        "Education",
        "Shopping",
        "Other"

    ];


    categories.forEach(
        category => {

            const amount =
                getCategoryTotal(
                    category
                );


            const percent =
                total > 0
                    ? amount / total * 100
                    : 0;


            const id =
                category.toLowerCase();


            document.getElementById(
                id + "Amount"
            ).textContent =
                money(amount);


            document.getElementById(
                id + "Percent"
            ).textContent =
                percent.toFixed(1) +
                "%";

        }
    );

}



/* =========================================
   DONUT CHART
========================================= */

function updateDonut(total) {

    if (total === 0) {

        document.getElementById(
            "donutChart"
        ).style.background =
            "conic-gradient(#19353c 0deg 360deg)";

        return;

    }


    const categoryColors = [

        ["Food", "#28d59a"],

        ["Travel", "#4b9cff"],

        ["Entertainment", "#a855f7"],

        ["Education", "#f6c453"],

        ["Shopping", "#ff8a5c"],

        ["Other", "#ff4f7a"]

    ];


    let current = 0;

    let pieces = [];


    categoryColors.forEach(
        item => {

            const category =
                item[0];

            const color =
                item[1];


            const amount =
                getCategoryTotal(
                    category
                );


            if (amount <= 0) {

                return;

            }


            const degrees =
                amount /
                total *
                360;


            pieces.push(

                `${color}
                ${current}deg
                ${current + degrees}deg`

            );


            current += degrees;

        }
    );


    document.getElementById(
        "donutChart"
    ).style.background =
        `conic-gradient(
            ${pieces.join(",")}
        )`;

}



/* =========================================
   ADD EXPENSE
========================================= */

document.getElementById(
    "expenseForm"
).addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const description =
            document.getElementById(
                "description"
            ).value.trim();


        const amount =
            Number(
                document.getElementById(
                    "amount"
                ).value
            );


        const category =
            document.getElementById(
                "category"
            ).value;


        if (
            description === "" ||
            amount <= 0
        ) {

            return;

        }


        expenses.unshift({

            id: Date.now(),

            description,

            amount,

            category,

            date: new Date(),
            walletId: (document.getElementById("bbExpenseWallet") || {}).value || "cash-default"

        });


        this.reset();


        closeModal(
            expenseModal
        );


        updateDashboard();

    }
);



/* =========================================
   DELETE
========================================= */

function deleteExpense(id) {

    expenses =
        expenses.filter(
            expense =>
                expense.id !== id
        );


    updateDashboard();

}



/* =========================================
   RENDER EXPENSES
========================================= */

function renderExpenses() {

    const list =
        document.getElementById(
            "expenseList"
        );


    if (expenses.length === 0) {

        list.innerHTML = `

            <div class="empty-state">

                No expenses added yet.

            </div>

        `;

        return;

    }


    list.innerHTML = "";


    expenses.forEach(
        expense => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "expense-item";


            div.innerHTML = `

                <div class="expense-left">

                    <div class="expense-icon">
                        ${getIcon(
                            expense.category
                        )}
                    </div>

                    <div>

                        <div class="expense-name">
                            ${escapeHTML(
                                expense.description
                            )}
                        </div>

                        <div class="expense-category">
                            ${expense.category}
                        </div>

                    </div>

                </div>


                <div class="expense-right">

                    <div class="expense-price">
                        ${money(
                            expense.amount
                        )}
                    </div>

                    <button
                        class="delete-btn"
                        onclick="deleteExpense(
                            ${expense.id}
                        )">

                        Delete

                    </button>

                </div>

            `;


            list.appendChild(div);

        }
    );

}



/* =========================================
   CATEGORY DETAILS
========================================= */

document
    .querySelectorAll(".category-row")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showCategory(
                        button.dataset.category
                    );

                }
            );

        }
    );



function showCategory(category) {

    categoryDetails.classList.add(
        "show"
    );


    document.getElementById(
        "detailsTitle"
    ).textContent =
        category;


    const items =
        expenses.filter(
            expense =>
                expense.category === category
        );


    categoryExpenseList.innerHTML =
        "";


    if (items.length === 0) {

        categoryExpenseList.innerHTML = `

            <div class="empty-state">

                No expenses recorded
                in ${category} yet.

            </div>

        `;

        return;

    }


    items.forEach(
        expense => {

            const date =
                new Date(
                    expense.date
                );


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "detail-expense";


            div.innerHTML = `

                <div class="detail-left">

                    <div class="detail-icon">

                        ${getIcon(
                            category
                        )}

                    </div>

                    <div>

                        <div class="detail-name">

                            ${escapeHTML(
                                expense.description
                            )}

                        </div>

                        <div class="detail-date">

                            ${date.toLocaleDateString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                }
                            )}

                        </div>

                    </div>

                </div>


                <div class="detail-amount">

                    ${money(
                        expense.amount
                    )}

                </div>

            `;


            categoryExpenseList.appendChild(
                div
            );

        }
    );


    const total =
        items.reduce(
            (sum, expense) =>
                sum + expense.amount,
            0
        );


    const totalDiv =
        document.createElement(
            "div"
        );


    totalDiv.className =
        "details-total";


    totalDiv.innerHTML = `

        <span>
            ${category} Total
        </span>

        <strong>
            ${money(total)}
        </strong>

    `;


    categoryExpenseList.appendChild(
        totalDiv
    );

}



/* =========================================
   CLOSE CATEGORY
========================================= */

document.getElementById(
    "closeDetails"
).addEventListener(
    "click",
    () => {

        categoryDetails.classList.remove(
            "show"
        );

    }
);



/* =========================================
   ICONS
========================================= */

function getIcon(category) {

    const icons = {

        Food: "F",

        Travel: "T",

        Entertainment: "E",

        Education: "E",

        Shopping: "S",

        Other: "O"

    };


    return icons[category] || "₹";

}



/* =========================================
   SMART TIP
========================================= */

function updateTip(percent) {

    const tip =
        document.getElementById(
            "smartTip"
        );


    if (expenses.length === 0) {

        tip.innerHTML = `

            <span class="tip-icon">
                ♧
            </span>

            <div>

                <strong>
                    You're comfortably within your budget.
                </strong>

                <p>
                    Keep tracking your spending.
                </p>

            </div>

        `;

        return;

    }


    if (percent < 50) {

        tip.innerHTML = `

            <span class="tip-icon">
                ♧
            </span>

            <div>

                <strong>
                    You're comfortably within your budget.
                </strong>

                <p>
                    Keep tracking your spending.
                </p>

            </div>

        `;

    }

    else if (percent < 75) {

        tip.innerHTML = `

            <span class="tip-icon">
                ♧
            </span>

            <div>

                <strong>
                    More than half of your budget is used.
                </strong>

                <p>
                    Keep an eye on unnecessary spending.
                </p>

            </div>

        `;

    }

    else if (percent < 100) {

        tip.innerHTML = `

            <span class="tip-icon">
                !
            </span>

            <div>

                <strong>
                    Your spending is approaching the limit.
                </strong>

                <p>
                    Consider reducing non-essential expenses.
                </p>

            </div>

        `;

    }

    else {

        tip.innerHTML = `

            <span class="tip-icon">
                !
            </span>

            <div>

                <strong>
                    Your expenses have exceeded the budget.
                </strong>

                <p>
                    Review your spending categories.
                </p>

            </div>

        `;

    }

}



/* =========================================
   MODAL OPEN
========================================= */

document.getElementById(
    "addExpenseBtn"
).addEventListener(
    "click",
    () => {

        expenseModal.classList.add(
            "show"
        );

        document.getElementById(
            "description"
        ).focus();

    }
);


document.getElementById(
    "navAddExpense"
).addEventListener(
    "click",
    () => {

        expenseModal.classList.add(
            "show"
        );

    }
);



/* =========================================
   CLOSE EXPENSE MODAL
========================================= */

document.getElementById(
    "closeExpenseModal"
).addEventListener(
    "click",
    () => {

        closeModal(
            expenseModal
        );

    }
);



/* =========================================
   BUDGET MODAL
========================================= */

document.getElementById(
    "editBudgetBtn"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "newBudget"
        ).value =
            budget;


        budgetModal.classList.add(
            "show"
        );

    }
);


document.getElementById(
    "navBudget"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "newBudget"
        ).value =
            budget;


        budgetModal.classList.add(
            "show"
        );

    }
);



/* =========================================
   SAVE BUDGET
========================================= */

document.getElementById(
    "budgetForm"
).addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const newBudget =
            Number(
                document.getElementById(
                    "newBudget"
                ).value
            );


        if (newBudget <= 0) {

            return;

        }


        budget =
            newBudget;


        closeModal(
            budgetModal
        );


        updateDashboard();

    }
);



/* =========================================
   CLOSE BUDGET
========================================= */

document.getElementById(
    "closeBudgetModal"
).addEventListener(
    "click",
    () => {

        closeModal(
            budgetModal
        );

    }
);



/* =========================================
   CLOSE MODAL FUNCTION
========================================= */

function closeModal(modal) {

    modal.classList.remove(
        "show"
    );

}



/* =========================================
   CLICK OUTSIDE MODAL
========================================= */

window.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            expenseModal
        ) {

            closeModal(
                expenseModal
            );

        }


        if (
            event.target ===
            budgetModal
        ) {

            closeModal(
                budgetModal
            );

        }

    }
);



/* =========================================
   VIEW ALL
========================================= */

document.getElementById(
    "viewAllBtn"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "recentExpensesPanel"
        ).scrollIntoView({
            behavior: "smooth"
        });

    }
);



/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(text) {

    const element =
        document.createElement(
            "div"
        );

    element.textContent =
        text;

    return element.innerHTML;

}



/* =========================================
   START
========================================= */

/* Dashboard rendering is triggered after Firebase authentication and cloud data load. */
/* =========================================================
   BUDGETBULL CINEMATIC OPENING
   ADD THIS AT THE VERY END OF script.js
========================================================= */

(function startBudgetBullCinematicIntro() {

    function createIntro() {

        /* Prevent duplicate intro */

        if (document.getElementById("cinematicIntro")) {
            return;
        }


        /* MAIN INTRO */

        const intro =
            document.createElement("div");

        intro.id =
            "cinematicIntro";


        /* PARTICLES */

        const particles =
            document.createElement("div");

        particles.className =
            "cinematic-particles";


        for (let i = 0; i < 28; i++) {

            const particle =
                document.createElement("span");

            particle.className =
                "cinematic-particle";

            particle.style.left =
                Math.random() * 100 + "%";

            particle.style.animationDuration =
                (5 + Math.random() * 7) + "s";

            particle.style.animationDelay =
                (Math.random() * 5) + "s";

            particle.style.opacity =
                0.3 + Math.random() * 0.7;

            particles.appendChild(
                particle
            );
        }


        /* CURRENCY */

        const currency1 =
            document.createElement("span");

        currency1.className =
            "cinematic-currency one";

        currency1.textContent =
            "$";


        const currency2 =
            document.createElement("span");

        currency2.className =
            "cinematic-currency two";

        currency2.textContent =
            "€";


        const currency3 =
            document.createElement("span");

        currency3.className =
            "cinematic-currency three";

        currency3.textContent =
            "¥";


        const currency4 =
            document.createElement("span");

        currency4.className =
            "cinematic-currency four";

        currency4.textContent =
            "£";


        /* BULL */

        const bull =
            document.createElement("img");

        bull.className =
            "cinematic-bull";

        bull.src =
            "bull.png";

        bull.alt =
            "";


        /* LIGHT */

        const light =
            document.createElement("div");

        light.className =
            "cinematic-light";


        /* VIGNETTE */

        const vignette =
            document.createElement("div");

        vignette.className =
            "cinematic-vignette";


        /* TOP / BOTTOM LINES */

        const lineTop =
            document.createElement("div");

        lineTop.className =
            "cinematic-line top";


        const lineBottom =
            document.createElement("div");

        lineBottom.className =
            "cinematic-line bottom";


        /* CONTENT */

        const content =
            document.createElement("div");

        content.className =
            "cinematic-content";


        content.innerHTML = `

            <div class="cinematic-overline">
                SMART MONEY MANAGEMENT
            </div>

            <div class="cinematic-logo">
                BUDGETBULL
            </div>

            <div class="cinematic-subtitle">
                EXPENSE TRACKER &amp; BUDGET ANALYZER
            </div>

            <div class="cinematic-tagline">
                TRACK&nbsp;&nbsp; • &nbsp;&nbsp;ANALYZE&nbsp;&nbsp; • &nbsp;&nbsp;GROW
            </div>

        `;


        /* BUILD */

        intro.appendChild(
            particles
        );

        intro.appendChild(
            currency1
        );

        intro.appendChild(
            currency2
        );

        intro.appendChild(
            currency3
        );

        intro.appendChild(
            currency4
        );

        intro.appendChild(
            bull
        );

        intro.appendChild(
            light
        );

        intro.appendChild(
            lineTop
        );

        intro.appendChild(
            lineBottom
        );

        intro.appendChild(
            content
        );

        intro.appendChild(
            vignette
        );


        document.body.appendChild(
            intro
        );


        /* LOCK SCROLL */

        document.body.style.overflow =
            "hidden";


        /*
           Start transition after
           cinematic sequence.
        */

        setTimeout(() => {

            intro.classList.add(
                "intro-finished"
            );

            document.body.style.overflow =
                "";

            setTimeout(() => {

                intro.remove();

            }, 1700);

        }, 8200);

    }


    /* Wait for page */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            createIntro
        );

    } else {

        createIntro();

    }

})();
/* =========================================================
   CINEMATIC TIMELINE
========================================================= */

(function cinematicTimeline() {

    function runTimeline() {

        const intro =
            document.getElementById("cinematicIntro");

        if (!intro) return;


        /* Stage 1
           Darkness + bull reveal
        */

        setTimeout(() => {

            intro.classList.add(
                "cinematic-stage-one"
            );

        }, 1000);


        /* Stage 2
           Logo impact
        */

        setTimeout(() => {

            intro.classList.add(
                "cinematic-stage-two"
            );

        }, 3500);


        /* Stage 3
           Final cinematic pulse
        */

        setTimeout(() => {

            intro.classList.add(
                "cinematic-stage-three"
            );

        }, 6000);


        /* Stage 4
           Exit
        */

        setTimeout(() => {

            intro.classList.add(
                "intro-finished"
            );

        }, 8200);

    }


    setTimeout(
        runTimeline,
        100
    );

})();
/* =========================================
   BUDGETBULL FIREBASE AUTH + DATA SYNC
   Keeps the existing dashboard and stores one
   private data document per signed-in user.
========================================= */


const authScreen = document.getElementById("authScreen");
const loginForm = document.getElementById("loginForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmit = document.getElementById("authSubmit");
const authMessage = document.getElementById("authMessage");
const toggleAuth = document.getElementById("toggleAuth");
const logoutBtn = document.getElementById("logoutBtn");

let isSignupMode = false;

function setAuthMessage(message, success = false) {
    authMessage.textContent = message;
    authMessage.style.color = success ? "#00e6a8" : "#ff8585";
}

function configIsReady() {
    const config = window.BUDGETBULL_CONFIG;
    return !!(
        config &&
        typeof config.apiKey === "string" && config.apiKey.trim().length > 10 &&
        typeof config.authDomain === "string" && config.authDomain.includes(".") &&
        typeof config.projectId === "string" && config.projectId.trim().length > 2 &&
        typeof config.appId === "string" && config.appId.trim().length > 5 &&
        !config.apiKey.includes("PASTE_YOUR") &&
        !config.authDomain.includes("PASTE_YOUR") &&
        !config.projectId.includes("PASTE_YOUR") &&
        !config.appId.includes("PASTE_YOUR")
    );
}

function initialiseFirebase() {
    if (!window.firebase || !window.firebase.initializeApp ||
        !window.firebase.auth || !window.firebase.firestore) {
        setAuthMessage("Firebase SDK did not load. Check your internet connection and refresh.");
        return false;
    }
    if (!configIsReady()) {
        setAuthMessage("Setup needed: add your Firebase web app config in config.js.");
        return false;
    }
    try {
        firebaseApp = window.firebase.apps.length
            ? window.firebase.app()
            : window.firebase.initializeApp(window.BUDGETBULL_CONFIG);
        firebaseAuth = firebaseApp.auth();
        firestoreDb = firebaseApp.firestore();
        return true;
    } catch (error) {
        console.error("BudgetBull Firebase setup error:", error);
        setAuthMessage("Firebase setup error. Check the web app values in config.js.");
        return false;
    }
}

function userDataDocument() {
    if (!firestoreDb || !currentUserId) return null;
    // Must match the Firestore rules configured for BudgetBull:
    // users/{userId}/{document=**}
    return firestoreDb.collection("users")
        .doc(currentUserId)
        .collection("private")
        .doc("data");
}

function currentPayload() {
    return {
        budget: Number(budget) || 20000,
        expenses: expenses.map(item => ({
            ...item,
            amount: Number(item.amount) || 0,
            date: item.date instanceof Date ? item.date.toISOString() : item.date
        })),
        advanced: window.BUDGETBULL_ADVANCED_GET ? window.BUDGETBULL_ADVANCED_GET() : (window.BUDGETBULL_ADVANCED || null),
        updatedAt: new Date().toISOString(),
        version: 2
    };
}

toggleAuth.addEventListener("click", () => {
    isSignupMode = !isSignupMode;
    authMessage.textContent = "";
    authSubmit.textContent = isSignupMode ? "Create Account" : "Login";
    toggleAuth.textContent = isSignupMode ? "Login" : "Create Account";
    authPassword.autocomplete = isSignupMode ? "new-password" : "current-password";
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!firebaseAuth && !initialiseFirebase()) return;

    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (!email || !password) {
        setAuthMessage("Enter your email and password.");
        return;
    }
    if (isSignupMode && password.length < 6) {
        setAuthMessage("Use a password with at least 6 characters.");
        return;
    }

    authSubmit.disabled = true;
    authSubmit.textContent = isSignupMode ? "Creating account…" : "Logging in…";
    setAuthMessage("");

    try {
        if (isSignupMode) {
            await firebaseAuth.createUserWithEmailAndPassword(email, password);
            // Firebase signs the new account in automatically.
            setAuthMessage("Account created successfully.", true);
        } else {
            await firebaseAuth.signInWithEmailAndPassword(email, password);
        }
        // onAuthStateChanged below opens the account and loads cloud data.
    } catch (error) {
        const code = error && error.code ? error.code : "";
        const message = error && error.message ? error.message : "Could not sign in.";
        if (code === "auth/email-already-in-use") {
            setAuthMessage("That email already has an account. Choose Login instead.");
        } else if (code === "auth/invalid-email") {
            setAuthMessage("Enter a valid email address.");
        } else if (code === "auth/weak-password") {
            setAuthMessage("Use a stronger password with at least 6 characters.");
        } else if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
            setAuthMessage("Email or password is incorrect. If this is your first time, choose Create Account.");
        } else if (/network-request-failed|failed to fetch/i.test(message)) {
            setAuthMessage("Could not reach Firebase. Check your internet connection and config.js.");
        } else {
            setAuthMessage(message);
        }
    } finally {
        authSubmit.disabled = false;
        authSubmit.textContent = isSignupMode ? "Create Account" : "Login";
    }
});

async function openUserSession(user) {
    if (!user || !user.uid) return;
    currentUserId = user.uid;
    authScreen.classList.add("hidden");
    logoutBtn.style.display = "block";
    const syncStatus = document.getElementById("cloudSyncStatus");
    if (syncStatus) {
        syncStatus.style.display = "block";
        syncStatus.textContent = "Loading cloud data…";
    }
    await loadCloudData();
}

async function loadCloudData() {
    if (!firestoreDb || !currentUserId) return;
    isLoadingCloudData = true;
    try {
        const ref = userDataDocument();
        const snapshot = await ref.get();

        if (snapshot.exists) {
            const saved = snapshot.data() || {};
            budget = Number(saved.budget) > 0 ? Number(saved.budget) : 20000;
            expenses = Array.isArray(saved.expenses)
                ? saved.expenses.map(item => ({
                    ...item,
                    id: Number(item.id) || Date.now() + Math.floor(Math.random() * 10000),
                    amount: Number(item.amount) || 0,
                    date: item.date || new Date().toISOString()
                }))
                : [];
            if (window.BUDGETBULL_ADVANCED_LOAD) window.BUDGETBULL_ADVANCED_LOAD(saved.advanced || null);
            updateDashboard();
            const syncStatus = document.getElementById("cloudSyncStatus");
            if (syncStatus) syncStatus.textContent = "Cloud data loaded";
            setAuthMessage("");
        } else {
            // First login for this account: create an empty cloud record.
            budget = 20000;
            expenses = [];
            if (window.BUDGETBULL_ADVANCED_LOAD) window.BUDGETBULL_ADVANCED_LOAD(null);
            updateDashboard();
            await ref.set(currentPayload());
            const syncStatus = document.getElementById("cloudSyncStatus");
            if (syncStatus) syncStatus.textContent = "Cloud saved";
        }
    } catch (error) {
        console.error("BudgetBull Firebase load failed:", error);
        authScreen.classList.remove("hidden");
        logoutBtn.style.display = "none";
        const syncStatus = document.getElementById("cloudSyncStatus");
        if (syncStatus) syncStatus.style.display = "none";
        setAuthMessage("Could not load cloud data. Check that Firestore rules are published and the Firebase config is correct.");
    } finally {
        isLoadingCloudData = false;
        if (currentUserId && firestoreDb) scheduleCloudSave();
    }
}

function scheduleCloudSave() {
    if (isLoadingCloudData || !currentUserId || !firestoreDb) return;
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(saveCloudDataNow, 700);
}

async function saveCloudDataNow() {
    if (isLoadingCloudData || !currentUserId || !firestoreDb || cloudSyncInProgress) return;
    cloudSyncInProgress = true;
    try {
        await userDataDocument().set(currentPayload());
        const syncStatus = document.getElementById("cloudSyncStatus");
        if (syncStatus) syncStatus.textContent = "Cloud saved";
    } catch (error) {
        const syncStatus = document.getElementById("cloudSyncStatus");
        if (syncStatus) syncStatus.textContent = "Cloud save failed — check setup";
        console.error("BudgetBull Firebase cloud save failed:", error);
    } finally {
        cloudSyncInProgress = false;
    }
}

logoutBtn.addEventListener("click", async () => {
    if (!firebaseAuth) return;
    await saveCloudDataNow();
    try {
        await firebaseAuth.signOut();
    } catch (error) {
        console.error("BudgetBull logout failed:", error);
    }
    currentUserId = null;
    authScreen.classList.remove("hidden");
    logoutBtn.style.display = "none";
    const syncStatus = document.getElementById("cloudSyncStatus");
    if (syncStatus) syncStatus.style.display = "none";
    authPassword.value = "";
    setAuthMessage("You have logged out.", true);
});

function checkAuthentication() {
    if (!initialiseFirebase()) {
        authScreen.classList.remove("hidden");
        logoutBtn.style.display = "none";
        const syncStatus = document.getElementById("cloudSyncStatus");
        if (syncStatus) syncStatus.style.display = "none";
        return;
    }
    firebaseAuth.onAuthStateChanged(async (user) => {
        if (user && user.uid !== currentUserId) {
            await openUserSession(user);
        } else if (!user) {
            currentUserId = null;
            authScreen.classList.remove("hidden");
            logoutBtn.style.display = "none";
            const syncStatus = document.getElementById("cloudSyncStatus");
            if (syncStatus) syncStatus.style.display = "none";
        }
    });
}

checkAuthentication();



/* =========================================
   BUDGETBULL ADVANCED MONEY CENTER
   Uses the existing expenses/budget/Firebase save flow.
========================================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const CATEGORIES = ['Food','Travel','Entertainment','Education','Shopping','Other'];
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const dateISO = value => { if (!value) return todayISO(); if (typeof value === 'string') return value.slice(0,10); const d = new Date(value); return Number.isNaN(d.getTime()) ? todayISO() : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const monthKey = value => dateISO(value).slice(0,7);
  const amount = value => Math.max(0, Number(value) || 0);
  const fmt = value => '₹' + amount(value).toLocaleString('en-IN',{maximumFractionDigits:2});
  const safe = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const initial = () => ({incomes:[],categoryBudgets:{},overallRollover:true,goals:[],recurring:[],wallets:[{id:'cash-default',name:'Cash',opening:0}],transfers:[],notifications:false,challenge:null,alerts:[],activeMonths:[],lastReportMonth:monthKey(todayISO())});
  let state = initial();
  let editingId = null;
  const notice = msg => { const el=$('bbNotice'); el.textContent=msg; el.classList.add('show'); };
  const clearNotice = () => $('bbNotice').classList.remove('show');
  const save = () => { try { window.BUDGETBULL_ADVANCED = state; if (typeof scheduleCloudSave === 'function') scheduleCloudSave(); } catch(e) { console.error('BudgetBull advanced save:',e); } };
  const readDate = x => dateISO(x && x.date);
  const inMonth = (x,m) => monthKey(readDate(x)) === m;
  const expenseList = () => Array.isArray(expenses) ? expenses : [];
  const monthExpenses = m => expenseList().filter(x => inMonth(x,m));
  const monthIncome = m => state.incomes.filter(x => inMonth(x,m)).reduce((s,x)=>s+amount(x.amount),0);
  const monthSpent = m => monthExpenses(m).reduce((s,x)=>s+amount(x.amount),0);
  const overallCarry = m => {
    if (!state.overallRollover) return 0;
    const [y,mo] = m.split('-').map(Number); const prev = `${mo===1?y-1:y}-${String(mo===1?12:mo-1).padStart(2,'0')}`;
    if (!state.activeMonths.includes(prev)) return 0;
    let unused = (Number(budget)||0) - monthSpent(prev);
    // Only the immediately preceding month's positive unused budget carries forward.
    return Math.max(0,unused);
  };
  const categorySpent = (cat,m) => monthExpenses(m).filter(x=>x.category===cat).reduce((s,x)=>s+amount(x.amount),0);
  const categoryCarry = (cat,m) => {
    const cfg=state.categoryBudgets[cat]; if(!cfg || !cfg.rollover) return 0;
    const [y,mo]=m.split('-').map(Number); const prev=`${mo===1?y-1:y}-${String(mo===1?12:mo-1).padStart(2,'0')}`;
    if (!state.activeMonths.includes(prev)) return 0;
    const unused=Number(cfg.limit||0)-categorySpent(cat,prev);
    return Math.max(0,Math.min(unused, cfg.cap>0?cfg.cap:Infinity));
  };
  const kpi = (label,value,sub='') => `<div class="bb-kpi"><span>${safe(label)}</span><strong>${safe(value)}</strong>${sub?`<small>${safe(sub)}</small>`:''}</div>`;
  function renderKpis(){
    const m=monthKey(todayISO()), income=monthIncome(m), spent=monthSpent(m), available=(Number(budget)||0)+overallCarry(m), net=income-spent;
    $('bbKpis').innerHTML=[kpi('Income this month',fmt(income)),kpi('Expenses this month',fmt(spent)),kpi('Available budget',fmt(available),`Includes ${fmt(overallCarry(m))} rollover`),kpi('Income − expenses',fmt(net),net<0?'Cash flow is negative':'Monthly cash flow')].join('');
    $('bbRolloverSummary').textContent=`This month: ${fmt(Number(budget)||0)} base budget + ${fmt(overallCarry(m))} previous-month unused budget = ${fmt(available)} available. Spent ${fmt(spent)}; remaining ${fmt(Math.max(0,available-spent))}.`;
  }
  function renderIncomes(){
    const arr=state.incomes.slice().sort((a,b)=>readDate(b).localeCompare(readDate(a)));
    $('bbIncomeList').innerHTML=arr.length?arr.slice(0,8).map(x=>`<div class="bb-row"><div class="bb-row-main"><strong>${safe(x.source)}</strong><small>${safe(readDate(x))}</small></div><div class="bb-row-actions"><strong>${fmt(x.amount)}</strong><button data-action="income-delete" data-id="${safe(x.id)}">Delete</button></div></div>`).join(''):'<div class="bb-empty">No income entries yet.</div>';
  }
  function renderCategoryBudgets(){
    const m=monthKey(todayISO());
    $('bbCategoryBudgets').innerHTML=CATEGORIES.map(cat=>{const cfg=state.categoryBudgets[cat];if(!cfg)return '';const carry=categoryCarry(cat,m),limit=Number(cfg.limit)||0,spent=categorySpent(cat,m),available=limit+carry,pct=available?Math.min(100,spent/available*100):0;return `<div class="bb-row"><div class="bb-row-main"><strong>${safe(cat)} — ${fmt(available)} available</strong><small>Base ${fmt(limit)} · rollover ${fmt(carry)} · spent ${fmt(spent)} · ${cfg.rollover?'rollover on':'rollover off'}</small><div class="bb-progress"><span style="width:${pct}%"></span></div></div><div class="bb-row-actions"><button data-action="budget-edit" data-category="${safe(cat)}">Edit</button><button data-action="budget-delete" data-category="${safe(cat)}">Remove</button></div></div>`;}).filter(Boolean).join('')||'<div class="bb-empty">Set a limit for a category to track its budget.</div>';
  }
  function renderGoals(){
    $('bbGoals').innerHTML=state.goals.length?state.goals.map(g=>{const saved=amount(g.saved),target=amount(g.target),pct=target?Math.min(100,saved/target*100):0;return `<div class="bb-row"><div class="bb-row-main"><strong>${safe(g.name)} · ${fmt(saved)} / ${fmt(target)}</strong><small>${g.targetDate?'Target '+safe(g.targetDate)+' · ':''}${fmt(Math.max(0,target-saved))} left</small><div class="bb-progress"><span style="width:${pct}%"></span></div></div><div class="bb-row-actions"><button data-action="goal-add" data-id="${safe(g.id)}">+ Save</button><button data-action="goal-delete" data-id="${safe(g.id)}">Delete</button></div></div>`;}).join(''):'<div class="bb-empty">Create a goal to track savings progress.</div>';
  }
  function renderRecurring(){
    $('bbRecurringList').innerHTML=state.recurring.length?state.recurring.map(r=>`<div class="bb-row"><div class="bb-row-main"><strong>${safe(r.name)} · ${fmt(r.amount)}</strong><small>${safe(r.category)} · ${safe(r.frequency)} · next due ${safe(r.nextDate)}${r.active===false?' · paused':''}</small></div><div class="bb-row-actions"><button data-action="recurring-toggle" data-id="${safe(r.id)}">${r.active===false?'Resume':'Pause'}</button><button data-action="recurring-delete" data-id="${safe(r.id)}">Delete</button></div></div>`).join(''):'<div class="bb-empty">No recurring bills added.</div>';
  }
  function renderWallets(){
    const opts=state.wallets.map(w=>`<option value="${safe(w.id)}">${safe(w.name)}</option>`).join('');['bbTransferFrom','bbTransferTo','bbExpenseWallet','bbIncomeWallet','bbEditWallet'].forEach(id=>{const el=$(id);if(el){const old=el.value;el.innerHTML=opts;if(state.wallets.some(w=>w.id===old))el.value=old;}});
    $('bbWallets').innerHTML=state.wallets.map(w=>{const out=state.transfers.filter(t=>t.from===w.id).reduce((s,t)=>s+t.amount,0),tin=state.transfers.filter(t=>t.to===w.id).reduce((s,t)=>s+t.amount,0),inc=state.incomes.filter(x=>(x.walletId||state.wallets[0]?.id)===w.id).reduce((s,x)=>s+amount(x.amount),0),spent=expenseList().filter(x=>(x.walletId||state.wallets[0]?.id)===w.id).reduce((s,x)=>s+amount(x.amount),0),bal=Number(w.opening)+inc+tin-out-spent;return `<div class="bb-row"><div class="bb-row-main"><strong>${safe(w.name)}</strong><small>Opening ${fmt(w.opening)} · income ${fmt(inc)} · expenses ${fmt(spent)} · transfers net ${fmt(tin-out)}</small></div><strong>${fmt(bal)}</strong></div>`;}).join('')||'<div class="bb-empty">Add a wallet to start.</div>';
  }
  function renderTransactions(){
    const query=$('bbTxnSearch').value.trim().toLowerCase(),cat=$('bbTxnCategory').value,from=$('bbTxnFrom').value,to=$('bbTxnTo').value,sort=$('bbTxnSort').value;
    let arr=expenseList().filter(x=>{const d=readDate(x),text=[x.description,x.notes,(x.tags||[]).join(' '),x.category].join(' ').toLowerCase();return (!query||text.includes(query))&&(!cat||x.category===cat)&&(!from||d>=from)&&(!to||d<=to);});
    arr.sort((a,b)=>sort==='date-asc'?readDate(a).localeCompare(readDate(b)):sort==='amount-desc'?amount(b.amount)-amount(a.amount):sort==='amount-asc'?amount(a.amount)-amount(b.amount):readDate(b).localeCompare(readDate(a)));
    $('bbTransactions').innerHTML=arr.length?arr.slice(0,100).map(x=>`<div class="bb-row"><div class="bb-row-main"><strong>${safe(x.description)} · ${fmt(x.amount)}</strong><small>${safe(x.category)} · ${safe(readDate(x))}${x.notes?' · '+safe(x.notes):''}${x.tags&&x.tags.length?' · #'+safe(x.tags.join(' #')):''}</small></div><div class="bb-row-actions"><button data-action="txn-edit" data-id="${safe(x.id)}">Edit</button><button data-action="txn-duplicate" data-id="${safe(x.id)}">Duplicate</button><button data-action="txn-delete" data-id="${safe(x.id)}">Delete</button></div></div>`).join(''):`<div class="bb-empty">${expenseList().length?'No transactions match these filters.':'No expenses recorded yet.'}</div>`;
  }
  function renderInsights(){
    const m=monthKey(todayISO()),spent=monthSpent(m),d=new Date(),days=d.getDate(),daysInMonth=new Date(d.getFullYear(),d.getMonth()+1,0).getDate(),forecast=days?spent/days*daysInMonth:0,prevD=new Date(d.getFullYear(),d.getMonth()-1,1),prev=`${prevD.getFullYear()}-${String(prevD.getMonth()+1).padStart(2,'0')}`,prevSpent=monthSpent(prev),budgetAvail=(Number(budget)||0)+overallCarry(m);
    const cats=CATEGORIES.map(c=>({c,v:categorySpent(c,m)})).sort((a,b)=>b.v-a.v);const alerts=[];
    if(spent>budgetAvail)alerts.push(`Budget exceeded by ${fmt(spent-budgetAvail)}.`);else alerts.push(`${fmt(Math.max(0,budgetAvail-spent))} of this month's budget remains.`);
    if(prevSpent>0)alerts.push(`Compared with last month: ${forecast>prevSpent?'projected spending is higher':'projected spending is lower'} (${fmt(forecast)} forecast vs ${fmt(prevSpent)} last month).`);
    if(cats[0]&&cats[0].v>0)alerts.push(`Top spending category: ${cats[0].c} (${fmt(cats[0].v)}).`);
    alerts.push(`Average daily spending so far: ${fmt(days?spent/days:0)}.`);
    $('bbInsights').innerHTML=alerts.map(t=>`<div class="bb-row"><div class="bb-row-main">${safe(t)}</div></div>`).join('');
    const bars=[{label:'Last month',v:prevSpent},{label:'This month',v:spent},{label:'Forecast',v:forecast}],max=Math.max(1,...bars.map(x=>x.v));$('bbTrend').innerHTML=bars.map(b=>`<div class="bb-barline"><span>${safe(b.label)}</span><div class="bb-bartrack"><div class="bb-barfill" style="width:${Math.min(100,b.v/max*100)}%"></div></div><strong>${fmt(b.v)}</strong></div>`).join('');
  }
  function renderChallenge(){
    const c=state.challenge;if(!c){$('bbChallengeStatus').textContent='No active challenge. Choose dates to start one.';return;}const now=todayISO(),within=now>=c.start&&now<=c.end,cat=c.mode==='shopping'?'Shopping':c.mode==='entertainment'?'Entertainment':null;const breaches=expenseList().filter(x=>readDate(x)>=c.start&&readDate(x)<=c.end&&(!cat||x.category===cat));$('bbChallengeStatus').textContent=`${within?'Challenge active':'Challenge period'}: ${c.start} to ${c.end}. ${breaches.length?breaches.length+' spending transaction(s) recorded in the selected scope.':'No spending transactions recorded in the selected scope.'}`;
  }
  function renderReport(){const m=$('bbReportMonth').value||monthKey(todayISO()),ex=monthExpenses(m),spent=ex.reduce((s,x)=>s+amount(x.amount),0),income=monthIncome(m);$('bbReportSummary').textContent=`${m}: ${ex.length} expenses · expenses ${fmt(spent)} · income ${fmt(income)} · net ${fmt(income-spent)}.`;}
  function renderAlerts(){const m=monthKey(todayISO()),spent=monthSpent(m),avail=(Number(budget)||0)+overallCarry(m),messages=[];if(spent>avail)messages.push(`Budget alert: exceeded by ${fmt(spent-avail)}.`);if(state.recurring.some(r=>r.active!==false&&r.nextDate<=todayISO()))messages.push('One or more recurring bills are due.');if(state.goals.some(g=>amount(g.saved)>=amount(g.target)))messages.push('Congratulations — at least one savings goal is complete!');$('bbAlerts').innerHTML=messages.map(x=>`<div class="bb-row"><div class="bb-row-main">${safe(x)}</div></div>`).join('')||'<div class="bb-empty">No alerts right now.</div>';if(messages.length&&state.notifications&&'Notification'in window&&Notification.permission==='granted'){const key=`${todayISO()}-${messages.join('|')}`;if(!state.alerts.includes(key)){try{new Notification('BudgetBull',{body:messages.join(' ')});state.alerts.push(key);save();}catch(e){console.warn('Notification unavailable',e);}}}}
  function render(){renderKpis();renderIncomes();renderCategoryBudgets();renderGoals();renderRecurring();renderWallets();renderTransactions();renderInsights();renderChallenge();renderReport();renderAlerts();}
  function exportCSV(){const rows=[['date','description','category','amount','notes','tags'],...expenseList().map(x=>[readDate(x),x.description||'',x.category||'Other',amount(x.amount),x.notes||'',(x.tags||[]).join('|')])];const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');download(csv,`budgetbull-expenses-${todayISO()}.csv`,'text/csv;charset=utf-8;');}
  function download(content,name,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportBackup(){const data={format:'BudgetBullBackup',version:1,budget:Number(budget)||20000,expenses:expenseList(),advanced:state,exportedAt:new Date().toISOString()};download(JSON.stringify(data,null,2),`budgetbull-backup-${todayISO()}.json`,'application/json');notice('Backup exported. Keep this file somewhere safe.');}
  function reportText(){const m=$('bbReportMonth').value||monthKey(todayISO()),ex=monthExpenses(m),income=monthIncome(m),spent=ex.reduce((s,x)=>s+amount(x.amount),0);return {m,ex,income,spent,net:income-spent};}
  function printReport(){const r=reportText(),w=window.open('','_blank');if(!w){notice('Pop-up blocked. Allow pop-ups to print the report.');return;}w.document.write(`<!doctype html><html><head><title>BudgetBull report ${safe(r.m)}</title><meta charset="utf-8"><style>body{font:14px Arial;padding:28px;color:#18232b}h1{margin-bottom:5px}table{border-collapse:collapse;width:100%;margin-top:20px}td,th{border:1px solid #bbb;padding:8px;text-align:left} .num{text-align:right}</style></head><body><h1>BudgetBull Monthly Report</h1><p>${safe(r.m)}</p><p>Income: ${fmt(r.income)} | Expenses: ${fmt(r.spent)} | Net cash flow: ${fmt(r.net)}</p><table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="num">Amount</th></tr></thead><tbody>${r.ex.map(x=>`<tr><td>${safe(readDate(x))}</td><td>${safe(x.description)}</td><td>${safe(x.category)}</td><td class="num">${fmt(x.amount)}</td></tr>`).join('')}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();}
  function duplicateExpense(x){const dupe=expenseList().some(y=>y!==x&&y.description.trim().toLowerCase()===String(x.description).trim().toLowerCase()&&amount(y.amount)===amount(x.amount)&&readDate(y)===readDate(x));if(dupe&&!confirm('A transaction with the same description, amount and date already exists. Create another copy anyway?'))return;const copy={...x,id:Date.now()+Math.floor(Math.random()*1000),date:readDate(x),tags:Array.isArray(x.tags)?[...x.tags]:[]};expenses.unshift(copy);updateDashboard();render();notice('Transaction duplicated.');}
  function openEdit(id){const x=expenseList().find(t=>String(t.id)===String(id));if(!x)return;editingId=x.id;$('bbEditId').value=x.id;$('bbEditDescription').value=x.description||'';$('bbEditAmount').value=amount(x.amount);$('bbEditCategory').value=CATEGORIES.includes(x.category)?x.category:'Other';$('bbEditDate').value=readDate(x);$('bbEditNotes').value=x.notes||'';$('bbEditTags').value=(x.tags||[]).join(', ');$('bbEditWallet').value=x.walletId||state.wallets[0]?.id||'cash-default';$('bbEditModal').classList.add('open');$('bbEditModal').setAttribute('aria-hidden','false');}
  function closeEdit(){$('bbEditModal').classList.remove('open');$('bbEditModal').setAttribute('aria-hidden','true');editingId=null;}
  function parseCSV(text){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&quoted&&n==='"'){field+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}else field+=c;}row.push(field);if(row.some(v=>v.trim()))rows.push(row);return rows;}
  function importCSVText(text){const rows=parseCSV(text);if(rows.length<2)throw new Error('CSV needs a header row and at least one transaction.');const headers=rows.shift().map(h=>h.trim().toLowerCase());const pick=(r,names)=>{const i=headers.findIndex(h=>names.includes(h));return i>=0?r[i]:'';};const imported=[];for(const r of rows){const desc=pick(r,['description','name','title','expense']);const val=Number(String(pick(r,['amount','value','total'])).replace(/[₹,\s]/g,''));if(!desc||!Number.isFinite(val)||val<=0)continue;const cat=pick(r,['category','type']);const date=pick(r,['date','transaction date'])||todayISO();imported.push({id:Date.now()+imported.length,description:desc.slice(0,120),amount:val,category:CATEGORIES.find(c=>c.toLowerCase()===cat.toLowerCase())||'Other',date:dateISO(date),notes:'Imported from CSV',tags:['imported']});}if(!imported.length)throw new Error('No valid transactions found. Expected date, description, amount and category columns.');const dupes=imported.filter(a=>expenseList().some(b=>String(b.description).toLowerCase()===a.description.toLowerCase()&&amount(b.amount)===a.amount&&readDate(b)===readDate(a))).length;if(dupes&&!confirm(`${dupes} likely duplicate row(s) found. Import all rows anyway?`))return;expenses.unshift(...imported);updateDashboard();render();notice(`${imported.length} transaction(s) imported.`);}
  function bind(){
    $('bbIncomeDate').value=todayISO();$('bbRecurringDate').value=todayISO();$('bbReportMonth').value=monthKey(todayISO());$('bbChallengeStart').value=todayISO();$('bbChallengeEnd').value=todayISO();$('bbNotifications').checked=!!state.notifications;$('bbOverallRollover').checked=!!state.overallRollover;
    $('bbIncomeForm').addEventListener('submit',e=>{e.preventDefault();const source=$('bbIncomeSource').value.trim(),amt=Number($('bbIncomeAmount').value),date=$('bbIncomeDate').value;if(!source||!Number.isFinite(amt)||amt<=0||!date)return;state.incomes.unshift({id:String(Date.now()),source,amount:amt,date,walletId:$('bbIncomeWallet').value||state.wallets[0]?.id});e.target.reset();$('bbIncomeDate').value=todayISO();save();render();notice('Income saved.');});
    $('bbCategoryBudgetForm').addEventListener('submit',e=>{e.preventDefault();const cat=$('bbBudgetCategory').value,limit=Number($('bbCategoryLimit').value),cap=$('bbRolloverCap').value===''?0:Number($('bbRolloverCap').value);if(!CATEGORIES.includes(cat)||!Number.isFinite(limit)||limit<=0||cap<0)return;state.categoryBudgets[cat]={limit,rollover:$('bbRolloverOn').checked,cap};save();render();notice(`${cat} budget saved.`);});
    $('bbOverallRollover').addEventListener('change',e=>{state.overallRollover=e.target.checked;save();render();});
    $('bbGoalForm').addEventListener('submit',e=>{e.preventDefault();const name=$('bbGoalName').value.trim(),target=Number($('bbGoalTarget').value),saved=Number($('bbGoalSaved').value)||0;if(!name||target<=0||saved<0)return;state.goals.push({id:String(Date.now()),name,target,saved,targetDate:$('bbGoalDate').value});e.target.reset();$('bbGoalSaved').value='0';save();render();notice('Savings goal added.');});
    $('bbRecurringForm').addEventListener('submit',e=>{e.preventDefault();const name=$('bbRecurringName').value.trim(),amt=Number($('bbRecurringAmount').value),date=$('bbRecurringDate').value;if(!name||amt<=0||!date)return;state.recurring.push({id:String(Date.now()),name,amount:amt,category:$('bbRecurringCategory').value,frequency:$('bbRecurringFrequency').value,nextDate:date,active:true,lastGeneratedDate:''});e.target.reset();$('bbRecurringDate').value=todayISO();save();render();notice('Recurring bill saved. Bills are only added when you click “Add due bills to expenses”.');});
    $('bbGenerateDue').addEventListener('click',()=>{let count=0;const today=todayISO();state.recurring.forEach(r=>{if(r.active===false||r.nextDate>today||r.lastGeneratedDate===r.nextDate)return;const due=r.nextDate;expenses.unshift({id:Date.now()+count,description:r.name,amount:amount(r.amount),category:r.category,date:due,notes:'Generated from recurring bill',tags:['recurring']});r.lastGeneratedDate=due;const d=new Date(`${due}T12:00:00`);if(r.frequency==='weekly')d.setDate(d.getDate()+7);else if(r.frequency==='yearly')d.setFullYear(d.getFullYear()+1);else d.setMonth(d.getMonth()+1);r.nextDate=dateISO(d);count++;});if(count){updateDashboard();save();render();notice(`${count} due bill(s) added. Each due date is added only once.`);}else notice('No new recurring bills are due.');});
    $('bbWalletForm').addEventListener('submit',e=>{e.preventDefault();const name=$('bbWalletName').value.trim(),opening=Number($('bbWalletBalance').value);if(!name||!Number.isFinite(opening)||state.wallets.some(w=>w.name.toLowerCase()===name.toLowerCase())){notice('Enter a unique wallet name and valid opening balance.');return;}state.wallets.push({id:String(Date.now()),name,opening});e.target.reset();$('bbWalletBalance').value='0';save();render();notice('Wallet added.');});
    $('bbTransferForm').addEventListener('submit',e=>{e.preventDefault();const from=$('bbTransferFrom').value,to=$('bbTransferTo').value,amt=Number($('bbTransferAmount').value);if(!from||!to||from===to||!Number.isFinite(amt)||amt<=0){notice('Choose two different wallets and enter a positive amount.');return;}const w=state.wallets.find(x=>x.id===from),out=state.transfers.filter(t=>t.from===from).reduce((s,t)=>s+t.amount,0),inc=state.transfers.filter(t=>t.to===from).reduce((s,t)=>s+t.amount,0),bal=Number(w.opening)+inc-out;if(amt>bal){if(!confirm(`This transfer exceeds the recorded ${w.name} balance (${fmt(bal)}). Record it anyway?`))return;}state.transfers.push({id:String(Date.now()),from,to,amount:amt,date:todayISO()});save();render();notice('Transfer recorded. Wallet balances updated.');});
    ['bbTxnSearch','bbTxnCategory','bbTxnFrom','bbTxnTo','bbTxnSort'].forEach(id=>$(id).addEventListener('input',renderTransactions));
    $('bbEditClose').addEventListener('click',closeEdit);$('bbEditModal').addEventListener('click',e=>{if(e.target===$('bbEditModal'))closeEdit();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeEdit();});
    $('bbEditForm').addEventListener('submit',e=>{e.preventDefault();const x=expenseList().find(t=>String(t.id)===String(editingId));if(!x)return;const desc=$('bbEditDescription').value.trim(),amt=Number($('bbEditAmount').value),date=$('bbEditDate').value;if(!desc||!Number.isFinite(amt)||amt<=0||!date)return;const dup=expenseList().some(t=>t!==x&&String(t.description).toLowerCase()===desc.toLowerCase()&&amount(t.amount)===amt&&readDate(t)===date);if(dup&&!confirm('This may be a duplicate transaction. Save anyway?'))return;Object.assign(x,{description:desc,amount:amt,category:$('bbEditCategory').value,date,notes:$('bbEditNotes').value.trim(),tags:$('bbEditTags').value.split(',').map(t=>t.trim()).filter(Boolean),walletId:$('bbEditWallet').value||state.wallets[0]?.id});closeEdit();updateDashboard();render();notice('Expense updated.');});
    $('bbTransactions').addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;const {action,id,category}=b.dataset;if(action==='txn-edit')openEdit(id);else if(action==='txn-duplicate'){const x=expenseList().find(t=>String(t.id)===String(id));if(x)duplicateExpense(x);}else if(action==='txn-delete'){if(confirm('Delete this expense?')){expenses=expenseList().filter(t=>String(t.id)!==String(id));updateDashboard();render();notice('Expense deleted.');}}else if(action==='budget-edit'){const cfg=state.categoryBudgets[category];if(cfg){$('bbBudgetCategory').value=category;$('bbCategoryLimit').value=cfg.limit;$('bbRolloverOn').checked=!!cfg.rollover;$('bbRolloverCap').value=cfg.cap||'';}}else if(action==='budget-delete'){delete state.categoryBudgets[category];save();render();}else if(action==='income-delete'){state.incomes=state.incomes.filter(x=>String(x.id)!==String(id));save();render();}else if(action==='goal-delete'){state.goals=state.goals.filter(x=>String(x.id)!==String(id));save();render();}else if(action==='goal-add'){const g=state.goals.find(x=>String(x.id)===String(id));if(!g)return;const val=prompt(`How much are you adding to ${g.name}?`);if(val===null)return;const n=Number(val);if(!Number.isFinite(n)||n<=0){notice('Enter a positive amount.');return;}g.saved=amount(g.saved)+n;save();render();}else if(action==='recurring-toggle'){const r=state.recurring.find(x=>String(x.id)===String(id));if(r){r.active=r.active===false;save();render();}}else if(action==='recurring-delete'){state.recurring=state.recurring.filter(x=>String(x.id)!==String(id));save();render();}});
    $('bbExportCSV').addEventListener('click',exportCSV);$('bbExportBackup').addEventListener('click',exportBackup);$('bbPrintReport').addEventListener('click',printReport);$('bbReportMonth').addEventListener('change',renderReport);
    $('bbImportCSVBtn').addEventListener('click',()=>$('bbImportCSV').click());$('bbImportCSV').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{importCSVText(await f.text());}catch(err){notice(err.message||'Could not import CSV.');}finally{e.target.value='';}});
    $('bbImportJSON').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!data||data.format!=='BudgetBullBackup'||!Array.isArray(data.expenses)||!data.advanced)throw new Error('This does not look like a BudgetBull backup.');if(!confirm('Restore this backup? Current expenses, budget and advanced settings will be replaced.'))return;budget=Number(data.budget)>0?Number(data.budget):20000;expenses=data.expenses.map(x=>({...x,amount:amount(x.amount),date:dateISO(x.date)}));state={...initial(),...data.advanced};state.incomes=Array.isArray(state.incomes)?state.incomes:[];updateDashboard();save();render();notice('Backup restored and queued for cloud save.');}catch(err){notice(err.message||'Could not restore backup.');}finally{e.target.value='';}});
    $('bbNotifications').addEventListener('change',async e=>{if(!e.target.checked){state.notifications=false;save();renderAlerts();return;}if(!('Notification'in window)){e.target.checked=false;notice('This browser does not support notifications.');return;}const permission=await Notification.requestPermission();state.notifications=permission==='granted';e.target.checked=state.notifications;save();renderAlerts();notice(state.notifications?'Browser notifications enabled.':'Notification permission was not granted.');});
    $('bbChallengeForm').addEventListener('submit',e=>{e.preventDefault();const start=$('bbChallengeStart').value,end=$('bbChallengeEnd').value;if(!start||!end||end<start){notice('Choose a valid challenge date range.');return;}state.challenge={start,end,mode:$('bbChallengeMode').value};save();renderChallenge();notice('No-spend challenge saved.');});
  }
  window.BUDGETBULL_ADVANCED_LOAD = function(saved){state={...initial(),...(saved&&typeof saved==='object'?saved:{})};state.incomes=Array.isArray(state.incomes)?state.incomes:[];state.goals=Array.isArray(state.goals)?state.goals:[];state.recurring=Array.isArray(state.recurring)?state.recurring:[];state.wallets=Array.isArray(state.wallets)&&saved&&saved.wallets?state.wallets:initial().wallets;state.transfers=Array.isArray(state.transfers)?state.transfers:[];state.categoryBudgets=state.categoryBudgets&&typeof state.categoryBudgets==='object'?state.categoryBudgets:{};state.alerts=Array.isArray(state.alerts)?state.alerts:[];state.activeMonths=Array.isArray(state.activeMonths)?state.activeMonths:[];const currentMonth=monthKey(todayISO());if(!state.activeMonths.includes(currentMonth))state.activeMonths.push(currentMonth);state.overallRollover=state.overallRollover!==false;window.BUDGETBULL_ADVANCED=state;render();};
  window.BUDGETBULL_ADVANCED_GET = () => state;
  window.BUDGETBULL_ADVANCED_REFRESH = () => {render();};
  document.addEventListener('DOMContentLoaded',()=>{bind();window.BUDGETBULL_ADVANCED_LOAD(window.BUDGETBULL_ADVANCED||null);});
})();
