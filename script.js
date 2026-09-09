(function () {

    "use strict";


    /* =========================================================
       PREVENT DOUBLE INITIALIZATION
    ========================================================= */

    if (window.__MOCCA_INITIALIZED__) {
        return;
    }

    window.__MOCCA_INITIALIZED__ = true;


    /* =========================================================
       CONFIG
    ========================================================= */

    const reduced =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const coarse =
        window.matchMedia("(pointer: coarse)").matches;

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    const SCROLL_SCRUB = 1.2;


    /* =========================================================
       GLOBAL HORIZONTAL OVERFLOW PROTECTION

       Evita que elementos 3D / transformaciones grandes
       puedan crear scroll lateral accidental.
    ========================================================= */

    document.documentElement.style.overflowX = "clip";
    document.body.style.overflowX = "clip";


    /* =========================================================
       REAL VIEWPORT — ESTABLE

       IMPORTANTE:
       No usamos visualViewport para la geometría de GSAP.

       visualViewport cambia cuando aparece/desaparece la
       barra del navegador en iPhone/Samsung y puede provocar
       refreshes constantes y alturas inconsistentes.

       GSAP usa:
       - window.innerHeight
       - document.documentElement.clientWidth
    ========================================================= */

    function getViewportHeight() {

        return Math.max(
            1,
            window.innerHeight
        );

    }


    function getViewportWidth() {

        return Math.max(
            1,
            document.documentElement.clientWidth
        );

    }


    function setRealViewport() {

        const width =
            getViewportWidth();

        const height =
            getViewportHeight();


        document.documentElement.style.setProperty(
            "--vh",
            `${height}px`
        );


        document.documentElement.style.setProperty(
            "--vw",
            `${width}px`
        );

    }


    setRealViewport();


    /* =========================================================
       VIEWPORT REFRESH

       No hacemos refresh con visualViewport.resize.

       En móviles el navegador puede disparar muchos cambios
       mientras aparece/desaparece la barra inferior/superior.

       Eso no debe alterar continuamente la geometría de
       ScrollTrigger.
    ========================================================= */

    let viewportRefreshTimer;


    function refreshViewport() {

        clearTimeout(
            viewportRefreshTimer
        );


        viewportRefreshTimer =
            setTimeout(
                () => {

                    setRealViewport();


                    if (
                        typeof ScrollTrigger !== "undefined"
                    ) {

                        ScrollTrigger.refresh();

                    }

                },
                250
            );

    }


    window.addEventListener(
        "resize",
        refreshViewport,
        {
            passive: true
        }
    );


    window.addEventListener(
        "orientationchange",
        () => {

            clearTimeout(
                viewportRefreshTimer
            );


            viewportRefreshTimer =
                setTimeout(
                    () => {

                        setRealViewport();


                        if (
                            typeof ScrollTrigger !== "undefined"
                        ) {

                            ScrollTrigger.refresh();

                        }

                    },
                    400
                );

        },
        {
            passive: true
        }
    );


    /* =========================================================
       SECTION DISTANCE
    ========================================================= */

    const SECTION_DISTANCE = () =>
        getViewportHeight() * 1.5;


    /* =========================================================
       CURSOR
    ========================================================= */

    const cursor =
        $(".cursor");


    if (
        cursor &&
        !coarse &&
        !reduced
    ) {

        window.addEventListener(
            "pointermove",
            (e) => {

                cursor.style.left =
                    `${e.clientX}px`;

                cursor.style.top =
                    `${e.clientY}px`;

            },
            {
                passive: true
            }
        );


        $$(
            "a, .service, .client, .language-switch"
        ).forEach(
            (element) => {

                element.addEventListener(
                    "mouseenter",
                    () => {

                        cursor.classList.add(
                            "is-large"
                        );

                    }
                );


                element.addEventListener(
                    "mouseleave",
                    () => {

                        cursor.classList.remove(
                            "is-large"
                        );

                    }
                );

            }
        );

    }


    /* =========================================================
       FALLBACK
    ========================================================= */

    if (
        reduced ||
        !window.gsap ||
        !window.ScrollTrigger
    ) {
        return;
    }


    const {
        gsap,
        ScrollTrigger
    } = window;


    gsap.registerPlugin(
        ScrollTrigger
    );


    /* =========================================================
       MOBILE SCROLLTRIGGER CONFIG

       Evita que pequeños cambios de la UI del navegador
       móvil provoquen recalculados constantes.
    ========================================================= */

    ScrollTrigger.config({
        ignoreMobileResize: true
    });
/* =========================================================
   SIDE INDEX
   NAVEGACIÓN EXACTA A LOS INICIOS DE LAS SECCIONES
========================================================= */

const sideNav =
    $(".side-nav");


if (sideNav) {

    const navLinks =
        $$(".side-nav a[href^='#']", sideNav);

    const logo =
        $(".logo");


    if (navLinks.length) {


        /* =====================================================
           GET SECTION FROM LINK
        ===================================================== */

        function getSectionFromLink(link) {

            const href =
                link.getAttribute("href");


            if (!href || href === "#") {
                return null;
            }


            const id =
                href.substring(1);


            if (!id) {
                return null;
            }


            return document.getElementById(id);

        }


        /* =====================================================
           GET SECTION START
        ===================================================== */

        function getSectionStart(section) {

            if (!section) {
                return 0;
            }


            /* =================================================
               1 — BUSCAR SCROLLTRIGGER DIRECTO
            ================================================= */

            const triggers =
                ScrollTrigger.getAll().filter(
                    (st) =>
                        st.trigger === section
                );


            if (triggers.length) {

                /*
                 * Si hay varios triggers sobre la misma sección,
                 * usamos el primero que tenga un start válido.
                 */

                const validTrigger =
                    triggers.find(
                        (st) =>
                            Number.isFinite(st.start)
                    );


                if (validTrigger) {

                    return Math.max(
                        0,
                        validTrigger.start
                    );

                }

            }


            /* =================================================
               2 — POSICIÓN REAL DEL ELEMENTO
            ================================================= */

            let top = 0;
            let element = section;


            while (
                element &&
                element !== document.body
            ) {

                top +=
                    element.offsetTop;


                element =
                    element.offsetParent;

            }


            return Math.max(
                0,
                top
            );

        }


        /* =====================================================
           GO TO SECTION
           MISMO SISTEMA PARA INDEX + LOGO
        ===================================================== */

        function goToSection(section) {

            if (!section) {
                return;
            }


            /*
             * Refrescamos antes de calcular la posición.
             * Esto es importante para que los pins de GSAP
             * tengan sus posiciones actuales.
             */

            ScrollTrigger.refresh();


            requestAnimationFrame(() => {

                const target =
                    getSectionStart(section);


                window.scrollTo({

                    top:
                        target,

                    behavior:
                        "smooth"

                });

            });

        }


        /* =====================================================
           SIDE INDEX
        ===================================================== */

        navLinks.forEach((link) => {

            link.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();


                    const section =
                        getSectionFromLink(link);


                    if (!section) {
                        return;
                    }


                    goToSection(section);

                }
            );

        });


        /* =====================================================
           LOGO → HOME
           USA EXACTAMENTE EL MISMO SISTEMA QUE EL SIDE INDEX
        ===================================================== */

        if (logo) {

            const homeSection =
                document.getElementById("home");


            if (homeSection) {

                logo.addEventListener(
                    "click",
                    (event) => {

                        event.preventDefault();


                        goToSection(
                            homeSection
                        );

                    }
                );

            }

        }


        /* =====================================================
           UPDATE ACTIVE INDEX
        ===================================================== */

        function updateActiveIndex() {

            const scroll =
                window.scrollY;


            let currentLink = null;

            let closestDistance =
                Infinity;


            navLinks.forEach((link) => {

                const section =
                    getSectionFromLink(link);


                if (!section) {
                    return;
                }


                const start =
                    getSectionStart(section);


                if (start <= scroll + 2) {

                    const distance =
                        scroll - start;


                    if (
                        distance <
                        closestDistance
                    ) {

                        closestDistance =
                            distance;


                        currentLink =
                            link;

                    }

                }

            });


            if (!currentLink) {

                currentLink =
                    navLinks[0];

            }


            navLinks.forEach((link) => {

                link.classList.toggle(
                    "active",
                    link === currentLink
                );

            });

        }


        /* =====================================================
           SCROLL UPDATE
        ===================================================== */

        let activeTick =
            false;


        window.addEventListener(

            "scroll",

            () => {

                if (activeTick) {
                    return;
                }


                activeTick =
                    true;


                requestAnimationFrame(() => {

                    updateActiveIndex();


                    activeTick =
                        false;

                });

            },

            {
                passive: true
            }

        );


        /* =====================================================
           REFRESH UPDATE
        ===================================================== */

        ScrollTrigger.addEventListener(
            "refresh",
            () => {

                updateActiveIndex();

            }
        );


        /* =====================================================
           INITIAL STATE
        ===================================================== */

        updateActiveIndex();

    }

}
 /* =========================================================
   MOCCA INTRO
   BLACK → MOCCA + DOT → SLOW BLINK

   SOLO SE EJECUTA UNA VEZ POR SESIÓN
========================================================= */

const ENABLE_MOCCA_INTRO =
    true;


const moccaIntro =
    $(".mocca-intro");


if (moccaIntro) {

    /* =====================================================
       CHECK — YA SE MOSTRÓ EN ESTA SESIÓN
    ===================================================== */

    const introAlreadyShown =
        sessionStorage.getItem(
            "moccaIntroShown"
        );


    /* =====================================================
       SI YA SE MOSTRÓ → ELIMINARLO
    ===================================================== */

    if (
        !ENABLE_MOCCA_INTRO ||
        introAlreadyShown === "true"
    ) {

        moccaIntro.style.display =
            "none";

    }


    /* =====================================================
       PRIMERA ENTRADA
    ===================================================== */

    else {

        sessionStorage.setItem(
            "moccaIntroShown",
            "true"
        );


        const moccaName =
            $(".mocca-intro-name", moccaIntro);

        const moccaDot =
            $(".mocca-intro-dot", moccaIntro);


        /* =================================================
           SCROLL LOCK
        ================================================= */

        const previousBodyOverflow =
            document.body.style.overflow;

        const previousHtmlOverflow =
            document.documentElement.style.overflow;


        document.body.style.overflow =
            "hidden";

        document.documentElement.style.overflow =
            "hidden";


        /* =================================================
           PREVENT WHEEL / TOUCH SCROLL
        ================================================= */

        const preventIntroScroll =
            function (event) {

                event.preventDefault();

            };


        window.addEventListener(
            "wheel",
            preventIntroScroll,
            {
                passive: false
            }
        );


        window.addEventListener(
            "touchmove",
            preventIntroScroll,
            {
                passive: false
            }
        );


        /* =================================================
           PREVENT KEYBOARD SCROLL
        ================================================= */

        const preventIntroKeys =
            function (event) {

                const blockedKeys = [

                    "ArrowUp",
                    "ArrowDown",
                    "PageUp",
                    "PageDown",
                    "Home",
                    "End",
                    " ",
                    "Spacebar"

                ];


                if (
                    blockedKeys.includes(
                        event.key
                    )
                ) {

                    event.preventDefault();

                }

            };


        window.addEventListener(
            "keydown",
            preventIntroKeys,
            {
                passive: false
            }
        );


        /* =================================================
           INITIAL
        ================================================= */

        gsap.set(
            moccaName,
            {
                opacity: 0
            }
        );


        gsap.set(
            moccaDot,
            {
                opacity: 0
            }
        );


        /* =================================================
           TIMELINE
        ================================================= */

        const intro =
            gsap.timeline();


        /* =================================================
           01 — BLACK
        ================================================= */

        intro.to(
            {},
            {
                duration: .45
            }
        );


        /* =================================================
           02 — MOCCA + DOT TOGETHER
        ================================================= */

        intro.to(
            [
                moccaName,
                moccaDot
            ],
            {
                opacity: 1,

                duration: .45,

                ease:
                    "power2.out"
            }
        );


        /* =================================================
           03 — SHORT HOLD
        ================================================= */

        intro.to(
            {},
            {
                duration: .45
            }
        );


        /* =================================================
           04 — SLOW BLINK
        ================================================= */

        intro.to(
            moccaDot,
            {
                opacity: 0,

                duration: .60,

                ease:
                    "power1.inOut"
            }
        );


        intro.to(
            moccaDot,
            {
                opacity: 1,

                duration: .60,

                ease:
                    "power1.inOut"
            }
        );


        intro.to(
            moccaDot,
            {
                opacity: 0,

                duration: .60,

                ease:
                    "power1.inOut"
            }
        );


        intro.to(
            moccaDot,
            {
                opacity: 1,

                duration: .60,

                ease:
                    "power1.inOut"
            }
        );


        /* =================================================
           05 — FINAL HOLD
        ================================================= */

        intro.to(
            {},
            {
                duration: .45
            }
        );


        /* =================================================
           06 — EXIT
        ================================================= */

        intro.to(
            moccaIntro,
            {
                opacity: 0,

                duration: .30,

                ease:
                    "power2.inOut",

                onComplete:
                    function () {

                        moccaIntro.style.display =
                            "none";


                        document.body.style.overflow =
                            previousBodyOverflow;


                        document.documentElement.style.overflow =
                            previousHtmlOverflow;


                        window.removeEventListener(
                            "wheel",
                            preventIntroScroll
                        );


                        window.removeEventListener(
                            "touchmove",
                            preventIntroScroll
                        );


                        window.removeEventListener(
                            "keydown",
                            preventIntroKeys
                        );


                        if (
                            typeof ScrollTrigger !==
                            "undefined"
                        ) {

                            ScrollTrigger.refresh();

                        }

                    }

            }
        );


        /* =================================================
           SAFETY
        ================================================= */

        intro.eventCallback(
            "onInterrupt",
            function () {

                moccaIntro.style.display =
                    "none";


                document.body.style.overflow =
                    previousBodyOverflow;


                document.documentElement.style.overflow =
                    previousHtmlOverflow;


                window.removeEventListener(
                    "wheel",
                    preventIntroScroll
                );


                window.removeEventListener(
                    "touchmove",
                    preventIntroScroll
                );


                window.removeEventListener(
                    "keydown",
                    preventIntroKeys
                );

            }
        );

    }

}
  /* =========================================================
   01 — HERO
   ESTABLE EN MÓVILES
========================================================= */

const hero =
    $(".hero");


if (hero) {

    const photo =
        $(".hero-photo", hero);

    const photoImg =
        $(".hero-photo img", hero);

    const title =
        $(".hero-title", hero);

    const words =
        $$(".hero-word", hero);


    if (
        photo &&
        photoImg &&
        title &&
        words.length >= 3
    ) {

        /* =================================================
           BRAND
        ================================================= */

        const brand =
            words[1];


        /* =================================================
           HERO ANIMATION
        ================================================= */

        const heroTimeline =
            gsap.timeline({
                paused: true
            });


        heroTimeline

            /* ---------------------------------------------
               IMAGE
            --------------------------------------------- */

            .to(
                photo,
                {
                    width: "58%",
                    left: "42%",
                    right: "auto",
                    ease: "none"
                },
                0
            )

            .to(
                photoImg,
                {
                    scale: 1,
                    ease: "none"
                },
                0
            )


            /* ---------------------------------------------
               BUSINESS
            --------------------------------------------- */

            .to(
                words[0],
                {
                    xPercent: -15,
                    ease: "none"
                },
                0
            )


            /* ---------------------------------------------
               GROWTH
            --------------------------------------------- */

            .to(
                words[2],
                {
                    xPercent: -7,
                    ease: "none"
                },
                0.08
            )


            /* ---------------------------------------------
               TITLE
            --------------------------------------------- */

            .to(
                title,
                {
                    width: "74%",
                    ease: "none"
                },
                0
            );


        /* =================================================
           HERO SCROLL DISTANCE

           El Hero está PINNED.

           No usamos "bottom top", porque el recorrido
           dependería directamente de la altura CSS de
           la sección y en móviles esa altura puede cambiar.

           Usamos una distancia fija basada en innerHeight.
        ================================================= */

        function getHeroScrollDistance() {

            const width =
                getViewportWidth();

            const height =
                getViewportHeight();


            if (width <= 390) {

                return Math.max(
                    height * 1.70,
                    900
                );

            }


            if (width <= 600) {

                return Math.max(
                    height * 1.55,
                    850
                );

            }


            if (width <= 900) {

                return Math.max(
                    height * 1.40,
                    800
                );

            }


            return Math.max(
                height * 1.20,
                800
            );

        }


        /* =================================================
           HERO SCROLLTRIGGER
        ================================================= */

        ScrollTrigger.create({

            trigger:
                hero,

            start:
                "top top",

            end:
                () =>
                    `+=${getHeroScrollDistance()}`,

            scrub:
                SCROLL_SCRUB,

            pin:
                true,

            pinSpacing:
                true,

            anticipatePin:
                1,

            invalidateOnRefresh:
                true,

            onUpdate:
                (self) => {

                    /* -----------------------------------------
                       RESTO DEL HERO
                    ----------------------------------------- */

                    heroTimeline.progress(
                        1 -
                        self.progress
                    );


                    /* -----------------------------------------
                       BRAND

                       DESPLAZAMIENTO MUCHO MAYOR

                       ↓ SCROLL DOWN
                       BRAND ← ← ←

                       ↑ SCROLL UP
                       BRAND → → →
                    ----------------------------------------- */

                    gsap.set(
                        brand,
                        {
                            xPercent:
                                -45 *
                                self.progress
                        }
                    );

                }

        });

    }

}


/* =========================================================
   BREAK
========================================================= */

const breakEl =
    $(".break");


if (breakEl) {

    const wipe =
        $(".break-wipe", breakEl);


    if (wipe) {

        gsap.set(
            breakEl,
            {
                scale: 1,
                transformOrigin:
                    "center center"
            }
        );


        const breakTimeline =
            gsap.timeline({

                scrollTrigger: {

                    trigger:
                        breakEl,

                    start:
                        "top bottom",

                    end:
                        "bottom top",

                    scrub:
                        SCROLL_SCRUB,

                    invalidateOnRefresh:
                        true

                }

            });


        breakTimeline.to(
            breakEl,
            {
                scale: 1.28,
                ease: "power1.inOut",
                duration: 1
            },
            0
        );


        breakTimeline.to(
            wipe,
            {
                scaleX: 1,
                transformOrigin:
                    "left center",
                ease: "power1.inOut",
                duration: 0.5
            },
            0
        );


        breakTimeline.to(
            breakEl,
            {
                scale: 1,
                ease: "power1.inOut",
                duration: 1
            },
            1
        );


        breakTimeline.to(
            wipe,
            {
                scaleX: 0,
                transformOrigin:
                    "right center",
                ease: "power1.inOut",
                duration: 0.5
            },
            1
        );

    }

}
    /* =========================================================
       02 — ABOUT
    ========================================================= */

    const about =
        $(".about");


    if (about) {

        const title =
            $(".about-title", about);

        const copy =
            $(".about-copy", about);

        const statement =
            $(".about-statement", about);


        if (
            title &&
            copy &&
            statement
        ) {


            function getReadingScreens() {

                const words =
                    copy.innerText
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean)
                        .length;


                return gsap.utils.clamp(
                    2,
                    4,
                    words * 0.025
                );

            }


            gsap.set(
                title,
                {
                    x: 0,
                    y: 0,
                    scale: 1,
                    opacity: 1
                }
            );


            gsap.set(
                copy,
                {
                    x: 0,
                    y: 25,
                    scale: 0.97,
                    opacity: 0,
                    visibility: "hidden"
                }
            );


            gsap.set(
                statement,
                {
                    x: 0,
                    y: 0,
                    scale: 0.94,
                    opacity: 0,
                    visibility: "hidden"
                }
            );


            const tl =
                gsap.timeline({

                    scrollTrigger: {

                        trigger:
                            about,

                        start:
                            "top top",

                        end:
                            function () {

                                const reading =
                                    getReadingScreens();


                                return "+=" +
                                    (
                                        getViewportHeight() *
                                        (
                                            2.35 +
                                            reading
                                        )
                                    );

                            },

                        pin:
                            true,

                        scrub:
                            SCROLL_SCRUB,

                        anticipatePin:
                            1,

                        invalidateOnRefresh:
                            true

                    }

                });


            /* =================================================
               TITLE — ENTRADA
            ================================================= */

            gsap.set(
                title,
                {
                    x: 0,
                    y: 0,
                    scale: 1.35,
                    opacity: 1,
                    transformOrigin:
                        "center center"
                }
            );


            tl.to(
                title,
                {
                    scale: 1,
                    duration: 1.0,
                    ease: "expo.out"
                }
            );


            /* =================================================
               COPY
            ================================================= */

            tl.set(
                copy,
                {
                    visibility:
                        "visible"
                }
            );


            tl.to(
                copy,
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.65,
                    ease: "power3.out"
                },
                "<0.15"
            );


            tl.to(
                title,
                {

                    x: function () {

                        return -(
                            getViewportWidth() *
                            (
                                getViewportWidth() <= 600
                                    ? 0.55
                                    : 0.65
                            )
                        );

                    },

                    scale: 0.88,
                    opacity: 0,

                    duration: 0.75,

                    ease:
                        "power3.inOut"

                },
                "<0.05"
            );


            tl.to(
                copy,
                {

                    y: function () {

                        return -(
                            getViewportHeight() *
                            0.008
                        );

                    },

                    duration: 0.35,

                    ease:
                        "power2.out"

                }
            );


            tl.to(
                copy,
                {

                    x: function () {

                        return -(
                            getViewportWidth() *
                            0.012
                        );

                    },

                    duration: function () {

                        return getReadingScreens();

                    },

                    ease:
                        "none"

                }
            );


            tl.to(
                copy,
                {

                    y: function () {

                        return -(
                            getViewportHeight() *
                            0.10
                        );

                    },

                    opacity: 0,

                    duration: 0.55,

                    ease:
                        "power3.in"

                }

            );


            /* =================================================
               STATEMENT
            ================================================= */

            tl.set(
                statement,
                {
                    visibility:
                        "visible"
                }
            );


            tl.fromTo(
                statement,
                {

                    y:
                        () =>
                            getViewportHeight() *
                            0.06,

                    scale:
                        0.94,

                    opacity:
                        0

                },
                {

                    y:
                        0,

                    scale:
                        1,

                    opacity:
                        1,

                    duration:
                        0.7,

                    ease:
                        "power3.out"

                }
            );


            tl.to(
                statement,
                {

                    scale: function () {

                        return getViewportWidth() <= 600
                            ? 1.015
                            : 1.025;

                    },

                    duration:
                        0.8,

                    ease:
                        "power2.inOut"

                }
            );


            tl.to(
                statement,
                {

                    y: function () {

                        return -(
                            getViewportHeight() *
                            0.055
                        );

                    },

                    scale: function () {

                        return getViewportWidth() <= 600
                            ? 0.985
                            : 0.965;

                    },

                    opacity:
                        0.28,

                    duration:
                        0.55,

                    ease:
                        "power3.inOut"

                }
            );


            tl.to(
                statement,
                {

                    y: function () {

                        return -(
                            getViewportHeight() *
                            0.10
                        );

                    },

                    scale: function () {

                        return getViewportWidth() <= 600
                            ? 0.96
                            : 0.93;

                    },

                    opacity:
                        0,

                    duration:
                        0.35,

                    ease:
                        "power3.in"

                }

            );

        }

    }

/* =========================================================
   03 — SERVICES
========================================================= */

const services =
    $(".services");


if (services) {

    const bg =
        $(".services-bg", services);

    const header =
        $(".services-header", services);

    const list =
        $(".services-list", services);


    if (
        bg &&
        header &&
        list
    ) {

        const items =
            $$(".service", services);

        const names =
            $$(".service-meta span", services);

        const lines =
            $$(".service-line", services);

        const infos =
            $$(".service-info", services);


        /* =================================================
           INITIAL STATE
        ================================================= */

        gsap.set(
            bg,
            {
                opacity: 0,
                scale: 1.02,
                filter: "blur(2px)"
            }
        );


        gsap.set(
            header,
            {
                opacity: 0,
                x: 0,
                y: 25,
                scale: 0.94,
                filter: "blur(2px)"
            }
        );


        gsap.set(
            list,
            {
                opacity: 0,
                x: 35,
                y: 20,
                scale: 0.97
            }
        );


        gsap.set(
            items,
            {
                opacity: 0,
                y: 8
            }
        );


        gsap.set(
            names,
            {
                opacity: 0
            }
        );


        gsap.set(
            lines,
            {
                scaleX: 0,
                opacity: 0,
                transformOrigin:
                    "right center"
            }
        );


        gsap.set(
            infos,
            {
                opacity: 0
            }
        );


        /* =================================================
           TIMELINE
        ================================================= */

        const tl =
            gsap.timeline({

                scrollTrigger: {

                    trigger:
                        services,

                    start:
                        "top top",

                    end:
                        () =>
                            `+=${getViewportHeight() * 5.4}`,

                    pin:
                        true,

                    scrub:
                        1.2,

                    anticipatePin:
                        1,

                    invalidateOnRefresh:
                        true

                }

            });


        /* =================================================
           01 — TITLE ENTERS
        ================================================= */

        tl.to(
            header,
            {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.75,
                ease: "power3.out"
            }
        );


        /* =================================================
           02 — BACKGROUND APPEARS
           
           El fondo permanece oculto hasta que el título
           ya ha aparecido.
        ================================================= */

        tl.to(
            bg,
            {
                opacity: 0.62,
                scale: 1.01,
                filter: "blur(0px)",
                duration: 0.75,
                ease: "power2.out"
            },
            "-=0.20"
        );


        /* =================================================
           03 — TITLE SETTLES
        ================================================= */

        tl.to(
            header,
            {
                scale: 1.025,
                duration: 0.45,
                ease: "power2.out"
            }
        );


        /* =================================================
           04 — TITLE MOVES AWAY
        ================================================= */

        tl.to(
            header,
            {

                x: () =>
                    -(
                        getViewportWidth() *
                        (
                            getViewportWidth() <= 600
                                ? 0.08
                                : 0.10
                        )
                    ),

                y: () =>
                    -(
                        getViewportHeight() *
                        0.015
                    ),

                scale: 0.92,
                opacity: 0.18,

                duration: 0.65,

                ease:
                    "power3.inOut"

            }
        );


        /* =================================================
           05 — SERVICES LIST
        ================================================= */

        tl.to(
            list,
            {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "power3.out"
            },
            "-=0.25"
        );


        /* =================================================
           06 — SERVICE ITEMS
        ================================================= */

        tl.to(
            items,
            {
                opacity: 1,
                y: 0,
                duration: 0.55,
                stagger: 0.035,
                ease: "power2.out"
            },
            "-=0.55"
        );


        /* =================================================
           07 — SERVICE NAMES
        ================================================= */

        tl.to(
            names,
            {
                opacity: 1,
                duration: 0.45,
                stagger: 0.035,
                ease: "power2.out"
            },
            "-=0.38"
        );


        /* =================================================
           08 — LINES
        ================================================= */

        tl.to(
            lines,
            {
                scaleX: 1,
                opacity: 1,
                duration: 0.45,
                stagger: 0.035,
                ease: "power2.out"
            },
            "-=0.38"
        );


        /* =================================================
           09 — INFO
        ================================================= */

        tl.to(
            infos,
            {
                opacity: 1,
                duration: 0.45,
                stagger: 0.035,
                ease: "power2.out"
            },
            "-=0.36"
        );


        /* =================================================
           10 — HOLD
        ================================================= */

        tl.to(
            {},
            {
                duration: 1.45,
                ease: "none"
            }
        );


        /* =================================================
           11 — LIST EXIT
        ================================================= */

        tl.to(
            list,
            {

                x: () =>
                    -(
                        getViewportWidth() *
                        0.035
                    ),

                y: () =>
                    -(
                        getViewportHeight() *
                        0.025
                    ),

                scale: 0.97,
                opacity: 0,

                duration: 0.75,

                ease:
                    "power3.inOut"

            }
        );


        /* =================================================
           12 — TITLE EXIT
        ================================================= */

        tl.to(
            header,
            {

                x: () =>
                    -(
                        getViewportWidth() *
                        0.16
                    ),

                y: () =>
                    -(
                        getViewportHeight() *
                        0.06
                    ),

                scale: 0.88,
                opacity: 0,

                filter:
                    "blur(3px)",

                duration: 0.75,

                ease:
                    "power3.in"

            },
            "-=0.55"
        );


        /* =================================================
           13 — BACKGROUND EXIT
        ================================================= */

        tl.to(
            bg,
            {
                opacity: 0,
                scale: 1.035,
                filter: "blur(2px)",
                duration: 1.05,
                ease:
                    "power2.inOut"
            },
            "-=0.35"
        );


        /* =================================================
           14 — END HOLD
        ================================================= */

        tl.to(
            {},
            {
                duration: 0.65,
                ease: "none"
            }
        );

    }

}
/* =========================================================
   04 — PROCESS
   REAL 3D HELIX + EDITORIAL INTRO
========================================================= */

const process =
    $(".process-3d");


if (process) {

    const world =
        $(".process-3d-world", process);

    const track =
        $(".process-3d-track", process);

    const items =
        $$(".process-3d-item", process);

    const fill =
        $(".process-3d-scroll-fill", process);

    const scrollUI =
        $(".process-3d-scroll", process);

    const intro =
        $(".process-3d-intro", process);


    if (
        world &&
        track &&
        items.length
    ) {


        /* =================================================
           PROCESS METRICS
           ADAPTATIVO A ANCHO + ALTO
        ================================================= */

        function getProcessMetrics() {

            const width =
                getViewportWidth();

            const height =
                getViewportHeight();

            const mobile =
                width <= 700;


            let factor;


            if (mobile) {

                factor =
                    gsap.utils.clamp(
                        0.68,
                        1,
                        Math.min(
                            width / 430,
                            height / 780
                        )
                    );

            }
            else {

                factor =
                    gsap.utils.clamp(
                        0.78,
                        1,
                        Math.min(
                            width / 1440,
                            height / 900
                        )
                    );

            }


            return {

                mobile,

                factor,

                radiusX:
                    (
                        mobile
                            ? 450
                            : 1200
                    ) *
                    factor,

                radiusY:
                    (
                        mobile
                            ? 260
                            : 650
                    ) *
                    factor,

                spacing:
                    (
                        mobile
                            ? 1200
                            : 1900
                    ) *
                    factor,

                farScale:
                    mobile
                        ? 0.18
                        : 0.16,

                nearScale:
                    mobile
                        ? 1.12
                        : 1.35

            };

        }


        /* =================================================
           HELIX CONFIG
        ================================================= */

        const turns =
            1.15;


        const angleStep =
            Math.PI *
            2 *
            turns;


        const initialOffset =
            0.55;


        /* =================================================
           INTRO PHASES
        ================================================= */

        const PHASE_INTRO_IN =
            0.00;

        const PHASE_INTRO_FULL =
            0.105;

        const PHASE_INTRO_OUT =
            0.235;

        const PHASE_HELIX =
            0.31;

        const PHASE_UI_IN =
            0.38;

        const PHASE_UI_FULL =
            0.46;


        /* =================================================
           SEGMENT RESISTANCE
        ================================================= */

        const STEP_COUNT =
            items.length;

        const BRAKE_START =
            0.32;

        const BRAKE_PEAK =
            0.82;

        const BRAKE_STRENGTH =
            0.82;


        /* =================================================
           HELIX LINE
           LÍNEA 3D QUE UNE LOS STEPS
        ================================================= */

        let helixLine =
            $(".process-3d-line", track);


        if (!helixLine) {

            helixLine =
                document.createElement(
                    "div"
                );

            helixLine.className =
                "process-3d-line";

            track.appendChild(
                helixLine
            );

        }


        /* =================================================
           WHITE COVER
        ================================================= */

        let whiteCover =
            $(".process-3d-white", process);


        if (!whiteCover) {

            whiteCover =
                document.createElement(
                    "div"
                );

            whiteCover.className =
                "process-3d-white";


            Object.assign(
                whiteCover.style,
                {

                    position:
                        "absolute",

                    inset:
                        "0",

                    width:
                        "100%",

                    height:
                        "100%",

                    background:
                        "#f3eee5",

                    zIndex:
                        "50",

                    pointerEvents:
                        "none"

                }
            );


            process.appendChild(
                whiteCover
            );

        }


        /* =================================================
           PROCESS → CLIENTS TRANSITION
        ================================================= */

        let transitionLayer =
            $(".transition-layer");


        if (!transitionLayer) {

            transitionLayer =
                document.createElement(
                    "div"
                );

            transitionLayer.className =
                "transition-layer";

            document.body.appendChild(
                transitionLayer
            );

        }


        gsap.set(
            transitionLayer,
            {

                scaleX:
                    0,

                transformOrigin:
                    "right center",

                opacity:
                    1,

                pointerEvents:
                    "none"

            }
        );


        /* =================================================
           INTRO ELEMENTS
        ================================================= */

        const introTitle =
            intro
                ? intro.querySelector(
                    "h1, h2, .process-title, .process-3d-title"
                )
                : null;


        const introDescription =
            intro
                ? intro.querySelector(
                    "p, .process-description, .process-3d-description"
                )
                : null;


        /* =================================================
           PROCESS INDEX
           
           04 / PROCESS

           ESTE ES EL ELEMENTO:
           .process-3d-index

           ENTRA Y SALE EXACTAMENTE CON EL TÍTULO.
        ================================================= */

        const processIndex =
            process.querySelector(
                ".process-3d-index"
            );


        /* =================================================
           INITIAL STATES
        ================================================= */

        gsap.set(
            whiteCover,
            {

                opacity:
                    1,

                zIndex:
                    50

            }
        );


        if (intro) {

            gsap.set(
                intro,
                {

                    opacity:
                        1,

                    zIndex:
                        60,

                    x:
                        0,

                    y:
                        0,

                    scale:
                        1,

                    filter:
                        "blur(0px)"

                }
            );

        }


        if (introTitle) {

            gsap.set(
                introTitle,
                {

                    opacity:
                        0,

                    x:
                        -34,

                    y:
                        22,

                    scale:
                        0.94,

                    filter:
                        "blur(2px)"

                }
            );

        }


        if (introDescription) {

            gsap.set(
                introDescription,
                {

                    opacity:
                        0,

                    x:
                        24,

                    y:
                        16,

                    scale:
                        0.98,

                    filter:
                        "blur(2px)"

                }
            );

        }


        /* =================================================
           PROCESS INDEX INITIAL STATE
           
           MISMO ESTADO INICIAL QUE EL TÍTULO
        ================================================= */

        if (processIndex) {

            gsap.set(
                processIndex,
                {

                    opacity:
                        0,

                    x:
                        -34,

                    y:
                        22,

                    scale:
                        0.94,

                    filter:
                        "blur(2px)"

                }
            );

        }


        if (scrollUI) {

            gsap.set(
                scrollUI,
                {

                    display:
                        "none",

                    opacity:
                        0,

                    visibility:
                        "hidden",

                    pointerEvents:
                        "none"

                }
            );

        }


        if (fill) {

            gsap.set(
                fill,
                {

                    width:
                        "0%",

                    opacity:
                        0

                }
            );

        }


        /* =================================================
           STATE
        ================================================= */

        const state = {

            progress:
                0,

            cinematic:
                0

        };


        /* =================================================
           HELPERS
        ================================================= */

        const clamp =
            gsap.utils.clamp;

        const mapRange =
            gsap.utils.mapRange;


        /* =================================================
           SEGMENT CURVE
        ================================================= */

        function getSegmentProgress(
            local
        ) {

            local =
                clamp(
                    0,
                    1,
                    local
                );


            if (
                local <=
                BRAKE_START
            ) {

                return local;

            }


            if (
                local <=
                BRAKE_PEAK
            ) {

                const t =
                    mapRange(
                        BRAKE_START,
                        BRAKE_PEAK,
                        0,
                        1,
                        local
                    );


                const eased =
                    t *
                    t *
                    t *
                    (
                        10 -
                        15 * t +
                        6 * t * t
                    );


                const available =
                    (
                        BRAKE_PEAK -
                        BRAKE_START
                    ) *
                    (
                        1 -
                        BRAKE_STRENGTH
                    );


                return (
                    BRAKE_START +
                    (
                        available *
                        eased
                    )
                );

            }


            const recoveryT =
                mapRange(
                    BRAKE_PEAK,
                    1,
                    0,
                    1,
                    local
                );


            const recovery =
                recoveryT *
                recoveryT *
                (
                    3 -
                    2 * recoveryT
                );


            const visualAtPeak =
                BRAKE_START +
                (
                    BRAKE_PEAK -
                    BRAKE_START
                ) *
                (
                    1 -
                    BRAKE_STRENGTH
                );


            return (
                visualAtPeak +
                (
                    1 -
                    visualAtPeak
                ) *
                recovery
            );

        }


        function getHelixProgress(
            rawProgress
        ) {

            rawProgress =
                clamp(
                    0,
                    1,
                    rawProgress
                );


            if (
                rawProgress >=
                1
            ) {

                return 1;

            }


            const absolute =
                rawProgress *
                STEP_COUNT;


            const step =
                Math.floor(
                    absolute
                );


            const local =
                absolute -
                step;


            const visualLocal =
                getSegmentProgress(
                    local
                );


            return (
                step +
                visualLocal
            ) /
            STEP_COUNT;

        }


        /* =================================================
           RENDER ITEM
        ================================================= */

        function renderItem(
            item,
            index,
            progress
        ) {

            const metrics =
                getProcessMetrics();


            const radiusX =
                metrics.radiusX;

            const radiusY =
                metrics.radiusY;

            const spacing =
                metrics.spacing;

            const farScale =
                metrics.farScale;

            const nearScale =
                metrics.nearScale;


            const position =
                index -
                progress +
                initialOffset;


            const z =
                -position *
                spacing;


            const angle =
                position *
                angleStep;


            const approach =
                clamp(
                    0,
                    1,
                    1 -
                    (
                        position /
                        (
                            items.length +
                            0.55
                        )
                    )
                );


            const light =
                clamp(
                    0.18,
                    1,
                    0.18 +
                    (
                        0.82 *
                        gsap.parseEase(
                            "power2.in"
                        )(
                            approach
                        )
                    )
                );


            const whiteR =
                Math.round(
                    243 *
                    light
                );


            const whiteG =
                Math.round(
                    238 *
                    light
                );


            const whiteB =
                Math.round(
                    229 *
                    light
                );


            const depthColor =
                `rgb(${whiteR}, ${whiteG}, ${whiteB})`;


            const radius =
                clamp(
                    0.82,
                    1,
                    0.82 +
                    (
                        0.18 *
                        clamp(
                            0,
                            1,
                            position /
                            (
                                items.length +
                                0.55
                            )
                        )
                    )
                );


            const x =
                Math.sin(angle) *
                radius *
                radiusX;


            const y =
                Math.cos(angle) *
                radius *
                radiusY;


            let scale =
                farScale +
                (
                    nearScale -
                    farScale
                ) *
                gsap.parseEase(
                    "power3.in"
                )(
                    approach
                );


            const rotation =
                Math.sin(angle) *
                4;


            let opacity =
                0;


            if (
                position >
                items.length
            ) {

                opacity =
                    0;

            }
            else if (
                position >
                0.18
            ) {

                opacity =
                    mapRange(
                        items.length,
                        0.18,
                        0.08,
                        0.95,
                        position
                    );

            }
            else if (
                position >
                0
            ) {

                opacity =
                    1;

            }
            else {

                const fade =
                    clamp(
                        0,
                        1,
                        Math.abs(
                            position
                        ) /
                        0.30
                    );


                opacity =
                    1 -
                    fade;

            }


            if (
                position <=
                0.18 &&
                position >=
                0
            ) {

                const close =
                    clamp(
                        0,
                        1,
                        1 -
                        (
                            position /
                            0.18
                        )
                    );


                scale =
                    nearScale +
                    (
                        nearScale *
                        0.35
                    ) *
                    close;


                opacity =
                    1;

            }


            if (
                position <=
                -0.30
            ) {

                opacity =
                    0;

            }


            gsap.set(
                item,
                {

                    xPercent:
                        -50,

                    yPercent:
                        -50,

                    x:
                        x,

                    y:
                        y,

                    z:
                        z,

                    rotation:
                        rotation,

                    scale:
                        scale,

                    opacity:
                        opacity,

                    color:
                        depthColor,

                    zIndex:
                        20

                }
            );

        }


        /* =================================================
           RENDER HELIX LINE
           LA ESPIRAL SE BORRA POR DETRÁS
           SEGÚN AVANZA EL SCROLL
        ================================================= */

        function renderHelixLine(
            progress
        ) {

            const metrics =
                getProcessMetrics();


            const radiusX =
                metrics.radiusX;

            const radiusY =
                metrics.radiusY;

            const spacing =
                metrics.spacing;


            const points = [];


            const totalPoints =
                180;


            const startPosition =
                Math.max(
                    0,
                    initialOffset -
                    progress
                );


            const endPosition =
                items.length +
                0.45 -
                progress +
                initialOffset;


            if (
                endPosition <=
                startPosition
            ) {

                gsap.set(
                    helixLine,
                    {
                        opacity:
                            0
                    }
                );

                return;

            }


            for (
                let i = 0;
                i <= totalPoints;
                i++
            ) {

                const position =
                    startPosition +
                    (
                        (
                            endPosition -
                            startPosition
                        ) *
                        (
                            i /
                            totalPoints
                        )
                    );


                const angle =
                    position *
                    angleStep;


                const radius =
                    clamp(
                        0.82,
                        1,
                        0.82 +
                        (
                            0.18 *
                            clamp(
                                0,
                                1,
                                position /
                                (
                                    items.length +
                                    0.55
                                )
                            )
                        )
                    );


                points.push({

                    x:
                        Math.sin(angle) *
                        radius *
                        radiusX,

                    y:
                        Math.cos(angle) *
                        radius *
                        radiusY,

                    z:
                        -position *
                        spacing

                });

            }


            const segments =
                [];


            for (
                let i = 0;
                i <
                points.length - 1;
                i++
            ) {

                const a =
                    points[i];

                const b =
                    points[i + 1];


                const dx =
                    b.x -
                    a.x;

                const dy =
                    b.y -
                    a.y;

                const dz =
                    b.z -
                    a.z;


                const length =
                    Math.sqrt(
                        (
                            dx *
                            dx
                        ) +
                        (
                            dy *
                            dy
                        ) +
                        (
                            dz *
                            dz
                        )
                    );


                const rotation =
                    Math.atan2(
                        dy,
                        dx
                    ) *
                    180 /
                    Math.PI;


                segments.push({

                    x:
                        (
                            a.x +
                            b.x
                        ) /
                        2,

                    y:
                        (
                            a.y +
                            b.y
                        ) /
                        2,

                    z:
                        (
                            a.z +
                            b.z
                        ) /
                        2,

                    length,

                    rotation

                });

            }


            if (
                helixLine.children.length !==
                segments.length
            ) {

                helixLine.innerHTML =
                    "";


                segments.forEach(
                    () => {

                        const segment =
                            document.createElement(
                                "span"
                            );


                        segment.className =
                            "process-3d-line-segment";


                        helixLine.appendChild(
                            segment
                        );

                    }
                );

            }


            Array.from(
                helixLine.children
            ).forEach(
                (
                    segment,
                    index
                ) => {

                    const data =
                        segments[index];


                    const segmentProgress =
                        index /
                        (
                            segments.length -
                            1
                        );


                    let opacity =
                        0.34;


                    if (
                        segmentProgress <
                        0.07
                    ) {

                        opacity *=
                            segmentProgress /
                            0.07;

                    }


                    if (
                        segmentProgress >
                        0.94
                    ) {

                        opacity *=
                            (
                                1 -
                                segmentProgress
                            ) /
                            0.06;

                    }


                    gsap.set(
                        segment,
                        {

                            xPercent:
                                -50,

                            yPercent:
                                -50,

                            x:
                                data.x,

                            y:
                                data.y,

                            z:
                                data.z -
                                35,

                            width:
                                data.length,

                            rotation:
                                data.rotation,

                            opacity:
                                opacity,

                            zIndex:
                                1

                        }
                    );

                }
            );

        }


        /* =================================================
           RENDER
        ================================================= */

        function render(
            progress
        ) {

            renderHelixLine(
                progress
            );


            items.forEach(
                (
                    item,
                    index
                ) => {

                    renderItem(
                        item,
                        index,
                        progress
                    );

                }
            );

        }


        /* =================================================
           CINEMATIC RENDER
        ================================================= */

        function renderCinematic(
            progress
        ) {

            state.cinematic =
                progress;


            const whiteProgress =
                clamp(
                    0,
                    1,
                    mapRange(
                        0,
                        0.055,
                        0,
                        1,
                        progress
                    )
                );


            gsap.set(
                whiteCover,
                {

                    opacity:
                        1 -
                        gsap.parseEase(
                            "power2.inOut"
                        )(
                            whiteProgress
                        )

                }
            );


            /* =============================================
               INTRO
            ============================================= */

            if (intro) {

                gsap.set(
                    intro,
                    {

                        opacity:
                            1,

                        zIndex:
                            60

                    }
                );


                /* =========================================
                   TITLE
                ========================================= */

                let titleEase =
                    0;

                let titleOutEase =
                    0;


                if (introTitle) {

                    const titleIn =
                        clamp(
                            0,
                            1,
                            mapRange(
                                PHASE_INTRO_IN,
                                PHASE_INTRO_FULL,
                                0,
                                1,
                                progress
                            )
                        );


                    titleEase =
                        gsap.parseEase(
                            "power3.out"
                        )(
                            titleIn
                        );


                    const titleOut =
                        clamp(
                            0,
                            1,
                            mapRange(
                                PHASE_INTRO_OUT,
                                PHASE_HELIX,
                                0,
                                1,
                                progress
                            )
                        );


                    titleOutEase =
                        gsap.parseEase(
                            "power3.inOut"
                        )(
                            titleOut
                        );


                    gsap.set(
                        introTitle,
                        {

                            opacity:
                                titleEase *
                                (
                                    1 -
                                    titleOutEase
                                ),

                            x:
                                (
                                    -34 *
                                    (
                                        1 -
                                        titleEase
                                    )
                                ),

                            y:
                                (
                                    22 *
                                    (
                                        1 -
                                        titleEase
                                    )
                                )
                                +
                                (
                                    110 *
                                    titleOutEase
                                ),

                            scale:
                                0.94 +
                                (
                                    0.06 *
                                    titleEase
                                )
                                -
                                (
                                    0.025 *
                                    titleOutEase
                                ),

                            filter:
                                `blur(${
                                    (
                                        2 *
                                        (
                                            1 -
                                            titleEase
                                        )
                                    )
                                    +
                                    (
                                        2 *
                                        titleOutEase
                                    )
                                }px)`

                        }
                    );

                }


                /* =========================================
                   PROCESS INDEX

                   04 / PROCESS

                   MISMA CURVA QUE EL TÍTULO
                ========================================= */

                if (processIndex) {

                    gsap.set(
                        processIndex,
                        {

                            opacity:
                                titleEase *
                                (
                                    1 -
                                    titleOutEase
                                ),

                            x:
                                (
                                    -34 *
                                    (
                                        1 -
                                        titleEase
                                    )
                                ),

                            y:
                                (
                                    22 *
                                    (
                                        1 -
                                        titleEase
                                    )
                                )
                                +
                                (
                                    110 *
                                    titleOutEase
                                ),

                            scale:
                                0.94 +
                                (
                                    0.06 *
                                    titleEase
                                )
                                -
                                (
                                    0.025 *
                                    titleOutEase
                                ),

                            filter:
                                `blur(${
                                    (
                                        2 *
                                        (
                                            1 -
                                            titleEase
                                        )
                                    )
                                    +
                                    (
                                        2 *
                                        titleOutEase
                                    )
                                }px)`

                        }
                    );

                }


                /* =========================================
                   DESCRIPTION
                ========================================= */

                if (introDescription) {

                    const descriptionIn =
                        clamp(
                            0,
                            1,
                            mapRange(
                                0.025,
                                PHASE_INTRO_FULL + 0.025,
                                0,
                                1,
                                progress
                            )
                        );


                    const descriptionEase =
                        gsap.parseEase(
                            "power3.out"
                        )(
                            descriptionIn
                        );


                    const descriptionOut =
                        clamp(
                            0,
                            1,
                            mapRange(
                                PHASE_INTRO_OUT + 0.015,
                                PHASE_HELIX,
                                0,
                                1,
                                progress
                            )
                        );


                    const descriptionOutEase =
                        gsap.parseEase(
                            "power3.inOut"
                        )(
                            descriptionOut
                        );


                    gsap.set(
                        introDescription,
                        {

                            opacity:
                                descriptionEase *
                                (
                                    1 -
                                    descriptionOutEase
                                ),

                            x:
                                (
                                    24 *
                                    (
                                        1 -
                                        descriptionEase
                                    )
                                ),

                            y:
                                (
                                    16 *
                                    (
                                        1 -
                                        descriptionEase
                                    )
                                )
                                +
                                (
                                    75 *
                                    descriptionOutEase
                                ),

                            scale:
                                0.98 +
                                (
                                    0.02 *
                                    descriptionEase
                                )
                                -
                                (
                                    0.02 *
                                    descriptionOutEase
                                ),

                            filter:
                                `blur(${
                                    (
                                        2 *
                                        (
                                            1 -
                                            descriptionEase
                                        )
                                    )
                                    +
                                    (
                                        2 *
                                        descriptionOutEase
                                    )
                                }px)`

                        }
                    );

                }


                /* =========================================
                   COMPOSITION
                ========================================= */

                const compositionIn =
                    gsap.parseEase(
                        "power2.out"
                    )(
                        clamp(
                            0,
                            1,
                            mapRange(
                                0,
                                PHASE_INTRO_FULL,
                                0,
                                1,
                                progress
                            )
                        )
                    );


                const compositionOut =
                    gsap.parseEase(
                        "power2.inOut"
                    )(
                        clamp(
                            0,
                            1,
                            mapRange(
                                PHASE_INTRO_OUT,
                                PHASE_HELIX,
                                0,
                                1,
                                progress
                            )
                        )
                    );


                gsap.set(
                    intro,
                    {

                        y:
                            5 *
                            (
                                1 -
                                compositionIn
                            )
                            -
                            (
                                7 *
                                compositionOut
                            ),

                        scale:
                            0.985 +
                            (
                                0.015 *
                                compositionIn
                            )
                            -
                            (
                                0.015 *
                                compositionOut
                            )

                    }
                );

            }


            /* =============================================
               HELIX
            ============================================= */

            const rawHelixProgress =
                clamp(
                    0,
                    1,
                    mapRange(
                        PHASE_HELIX,
                        1,
                        0,
                        1,
                        progress
                    )
                );


            const helixProgress =
                getHelixProgress(
                    rawHelixProgress
                );


            state.progress =
                helixProgress *
                items.length;


            render(
                state.progress
            );


            /*
             * La hélice y su línea permanecen
             * completamente invisibles mientras
             * la intro no haya terminado.
             */

            if (
                progress <
                PHASE_HELIX
            ) {

                items.forEach(
                    item => {

                        gsap.set(
                            item,
                            {
                                opacity:
                                    0
                            }
                        );

                    }
                );


                gsap.set(
                    helixLine,
                    {

                        opacity:
                            0

                    }
                );

            }
            else {

                gsap.set(
                    helixLine,
                    {

                        opacity:
                            1

                    }
                );

            }


            /* =============================================
               TRACK
            ============================================= */

            gsap.set(
                track,
                {

                    rotationX:
                        -4 *
                        helixProgress,

                    rotationZ:
                        6 *
                        helixProgress,

                    transformStyle:
                        "preserve-3d"

                }
            );


            /* =============================================
               SCROLL UI
            ============================================= */

            if (scrollUI) {

                if (
                    progress <
                    PHASE_UI_IN
                ) {

                    gsap.set(
                        scrollUI,
                        {

                            display:
                                "none",

                            opacity:
                                0,

                            visibility:
                                "hidden",

                            pointerEvents:
                                "none"

                        }
                    );

                }
                else {

                    const uiOpacity =
                        clamp(
                            0,
                            1,
                            mapRange(
                                PHASE_UI_IN,
                                PHASE_UI_FULL,
                                0,
                                1,
                                progress
                            )
                        );


                    gsap.set(
                        scrollUI,
                        {

                            display:
                                "block",

                            opacity:
                                uiOpacity,

                            visibility:
                                "visible",

                            pointerEvents:
                                "none"

                        }
                    );

                }

            }


            /* =============================================
               SCROLL FILL
            ============================================= */

            if (fill) {

                if (
                    progress <
                    PHASE_UI_IN
                ) {

                    gsap.set(
                        fill,
                        {

                            width:
                                "0%",

                            opacity:
                                0

                        }
                    );

                }
                else {

                    const fillOpacity =
                        clamp(
                            0,
                            1,
                            mapRange(
                                PHASE_UI_IN,
                                PHASE_UI_FULL,
                                0,
                                1,
                                progress
                            )
                        );


                    gsap.set(
                        fill,
                        {

                            width:
                                `${helixProgress * 100}%`,

                            opacity:
                                fillOpacity

                        }
                    );

                }

            }

        }


        /* =================================================
           INITIAL RENDER
        ================================================= */

        renderCinematic(
            0
        );


        /* =================================================
           PROCESS SCROLL DISTANCE
        ================================================= */

        function getProcessScrollDistance() {

            const width =
                getViewportWidth();

            const height =
                getViewportHeight();


            if (
                width <=
                390
            ) {

                return Math.max(
                    height * 8.0,
                    6000
                );

            }


            if (
                width <=
                600
            ) {

                return Math.max(
                    height * 8.25,
                    6200
                );

            }


            if (
                width <=
                700
            ) {

                return Math.max(
                    height * 8.5,
                    6400
                );

            }


            return Math.max(
                height * 9,
                7000
            );

        }


        /* =================================================
           SCROLLTRIGGER
        ================================================= */

        ScrollTrigger.create({

            trigger:
                process,

            start:
                "top top",

            end:
                () =>
                    `+=${getProcessScrollDistance()}`,

            pin:
                true,

            pinSpacing:
                true,

            scrub:
                false,

            anticipatePin:
                1,

            invalidateOnRefresh:
                true,


            /* =================================================
               ENTER
            ================================================= */

            onEnter:
                function () {

                    gsap.killTweensOf(
                        transitionLayer
                    );


                    gsap.set(
                        transitionLayer,
                        {

                            scaleX:
                                0,

                            transformOrigin:
                                "right center",

                            opacity:
                                1

                        }
                    );


                    renderCinematic(
                        0
                    );

                },


            /* =================================================
               ENTER BACK
            ================================================= */

            onEnterBack:
                function (self) {

                    gsap.killTweensOf(
                        transitionLayer
                    );


                    gsap.set(
                        transitionLayer,
                        {

                            scaleX:
                                0,

                            transformOrigin:
                                "left center",

                            opacity:
                                1

                        }
                    );


                    gsap.to(
                        transitionLayer,
                        {

                            scaleX:
                                1,

                            duration:
                                0.55,

                            ease:
                                "power3.inOut"

                        }
                    );


                    gsap.to(
                        transitionLayer,
                        {

                            scaleX:
                                0,

                            transformOrigin:
                                "right center",

                            duration:
                                0.65,

                            delay:
                                0.55,

                            ease:
                                "power3.inOut"

                        }
                    );


                    renderCinematic(
                        self.progress
                    );

                },


            /* =================================================
               LEAVE BACK
            ================================================= */

            onLeaveBack:
                function () {

                    gsap.killTweensOf(
                        transitionLayer
                    );


                    gsap.set(
                        transitionLayer,
                        {

                            scaleX:
                                0,

                            transformOrigin:
                                "right center",

                            opacity:
                                1

                        }
                    );


                    renderCinematic(
                        0
                    );

                },


            /* =================================================
               LEAVE
            ================================================= */

            onLeave:
                function () {

                    if (scrollUI) {

                        gsap.set(
                            scrollUI,
                            {

                                display:
                                    "none",

                                opacity:
                                    0,

                                visibility:
                                    "hidden"

                            }
                        );

                    }


                    gsap.killTweensOf(
                        transitionLayer
                    );


                    gsap.set(
                        transitionLayer,
                        {

                            scaleX:
                                0,

                            transformOrigin:
                                "right center",

                            opacity:
                                1

                        }
                    );


                    gsap.to(
                        transitionLayer,
                        {

                            scaleX:
                                1,

                            duration:
                                0.55,

                            ease:
                                "power3.inOut"

                        }
                    );


                    gsap.to(
                        transitionLayer,
                        {

                            scaleX:
                                0,

                            transformOrigin:
                                "left center",

                            duration:
                                0.65,

                            delay:
                                0.55,

                            ease:
                                "power3.inOut"

                        }
                    );

                },


            /* =================================================
               UPDATE
            ================================================= */

            onUpdate:
                function (self) {

                    renderCinematic(
                        self.progress
                    );

                }

        });

    }

}/* =========================================================
   05 — CLIENTS
========================================================= */

const clients =
    $(".clients");


if (clients) {

    const header =
        $(".clients-header", clients);

    const scene01 =
        $(".clients-scene-01", clients);

    const intro =
        $(".clients-intro", clients);

    const introLabel =
        $(".clients-intro .clients-label", clients);

    const introTitle =
        $(".clients-intro h2", clients);

    const clientGrid =
        $(".clients-grid", clients);

    const clientItems =
        $$(".client-item", clients);

    const scene02 =
        $(".clients-scene-02", clients);

    const values =
        $(".clients-values", clients);

    const valueItems =
        $$(".client-value", clients);

    const valuesIntro =
        $(".clients-values-intro", clients);

    const valuesLabel =
        $(".clients-values-intro .clients-label", clients);

    const valuesTitle =
        $(".clients-values-intro h2", clients);

    const end =
        $(".clients-end", clients);


    if (
        header &&
        scene01 &&
        intro &&
        introLabel &&
        introTitle &&
        clientGrid &&
        clientItems.length &&
        scene02 &&
        values &&
        valueItems.length &&
        valuesIntro &&
        valuesLabel &&
        valuesTitle &&
        end
    ) {


        /* =================================================
           INITIAL STATES
        ================================================== */

        gsap.set(
            header,
            {
                opacity: 0
            }
        );


        gsap.set(
            scene01,
            {
                autoAlpha: 1
            }
        );


        gsap.set(
            intro,
            {
                autoAlpha: 0,
                x: -30
            }
        );


        gsap.set(
            introLabel,
            {
                autoAlpha: 0,
                y: 12
            }
        );


        gsap.set(
            introTitle,
            {
                autoAlpha: 0,
                y: 18
            }
        );


        gsap.set(
            clientGrid,
            {
                autoAlpha: 0,
                x: 30
            }
        );


        gsap.set(
            clientItems,
            {
                autoAlpha: 0,
                y: 8
            }
        );


        gsap.set(
            scene02,
            {
                autoAlpha: 0
            }
        );


        gsap.set(
            values,
            {
                autoAlpha: 0,
                x: -30
            }
        );


        gsap.set(
            valueItems,
            {
                autoAlpha: 0,
                y: 8
            }
        );


        gsap.set(
            valuesIntro,
            {
                autoAlpha: 0,
                x: 30
            }
        );


        gsap.set(
            valuesLabel,
            {
                autoAlpha: 0,
                y: 12
            }
        );


        gsap.set(
            valuesTitle,
            {
                autoAlpha: 0,
                y: 18
            }
        );


        gsap.set(
            end,
            {
                autoAlpha: 0,
                y: 25
            }
        );


        /* =================================================
           CLIENTS TIMELINE
        ================================================== */

        const tl =
            gsap.timeline({

                scrollTrigger: {

                    trigger:
                        clients,

                    start:
                        "top top",

                    end:
                        () =>
                            `+=${getViewportHeight() * 2.8}`,

                    scrub:
                        1.25,

                    pin:
                        true,

                    anticipatePin:
                        1,

                    invalidateOnRefresh:
                        true

                }

            });


        /* =================================================
           HEADER
        ================================================== */

        tl.to(
            header,
            {
                opacity: 1,
                duration: 0.4,
                ease: "power2.out"
            }
        );


        /* =================================================
           FIRST SCENE
        ================================================== */

        tl.to(
            intro,
            {
                autoAlpha: 1,
                x: 0,
                duration: 0.7,
                ease: "power3.out"
            }
        );


        tl.to(
            introLabel,
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out"
            },
            "-=0.45"
        );


        tl.to(
            introTitle,
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: "power3.out"
            },
            "-=0.28"
        );


        tl.to(
            clientGrid,
            {
                autoAlpha: 1,
                x: 0,
                duration: 0.7,
                ease: "power3.out"
            },
            "-=0.55"
        );


        tl.to(
            clientItems,
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.035,
                ease: "power2.out"
            },
            "-=0.42"
        );


        /* =================================================
           FIRST HOLD
        ================================================== */

        tl.to(
            {},
            {
                duration: 1.15,
                ease: "none"
            }
        );


        /* =================================================
           FIRST OUT
        ================================================== */

        tl.to(
            intro,
            {
                autoAlpha: 0,
                x: -35,
                duration: 0.65,
                ease: "power2.inOut"
            }
        );


        tl.to(
            clientGrid,
            {
                autoAlpha: 0,
                x: 35,
                duration: 0.65,
                ease: "power2.inOut"
            },
            "<"
        );


        /* =================================================
           SECOND SCENE
        ================================================== */

        tl.set(
            scene02,
            {
                autoAlpha: 1
            }
        );


        tl.to(
            values,
            {
                autoAlpha: 1,
                x: 0,
                duration: 0.75,
                ease: "power3.out"
            }
        );


        tl.to(
            valuesIntro,
            {
                autoAlpha: 1,
                x: 0,
                duration: 0.75,
                ease: "power3.out"
            },
            "<"
        );


        tl.to(
            valuesLabel,
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out"
            },
            "-=0.48"
        );


        tl.to(
            valuesTitle,
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: "power3.out"
            },
            "-=0.28"
        );


        tl.to(
            valueItems,
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.5,
                stagger: 0.045,
                ease: "power2.out"
            },
            "-=0.38"
        );


        /* =================================================
           SECOND HOLD
        ================================================== */

        tl.to(
            {},
            {
                duration: 1.15,
                ease: "none"
            }
        );


        /* =================================================
           SECOND OUT
        ================================================== */

        tl.to(
            values,
            {
                autoAlpha: 0,
                x: -35,
                duration: 0.7,
                ease: "power2.inOut"
            }
        );


        tl.to(
            valuesIntro,
            {
                autoAlpha: 0,
                x: 35,
                duration: 0.7,
                ease: "power2.inOut"
            },
            "<"
        );


        /* =================================================
           FINAL — CHANGES / THINGS.
        ================================================== */

        tl.to(
            end,
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.85,
                ease: "power3.out"
            },
            "+=0.3"
        );


        /* =================================================
           FINAL HOLD
           
           BEFORE:
           duration: 0.85

           NOW:
           duration: 2.2
        ================================================== */

        tl.to(
            {},
            {
                duration: 2.2,
                ease: "none"
            }
        );

    }

}


/* =========================================================
   CLIENTS TRANSITION
========================================================= */

const clientsTransition =
    $(".clients-transition");


if (clientsTransition) {

    const model =
        $(".clients-transition-model", clientsTransition);

    const image =
        $(".clients-transition-model img", clientsTransition);

    const copy =
        $(".clients-transition-copy", clientsTransition);


    if (
        model &&
        image &&
        copy
    ) {


        /* =================================================
           INITIAL — MODEL
        ================================================= */

        gsap.set(
            model,
            {
                opacity: 0,

                x: () =>
                    getViewportWidth() * 0.12,

                y: () =>
                    getViewportHeight() * 0.18,

                scale: 0.82,

                zIndex: 40
            }
        );


        /* =================================================
           INITIAL — IMAGE
        ================================================= */

        gsap.set(
            image,
            {
                opacity: 0,

                y: () =>
                    getViewportHeight() * 0.06,

                scale: 1.04,

                filter:
                    "blur(5px)"
            }
        );


        /* =================================================
           INITIAL — COPY
        ================================================= */

        gsap.set(
            copy,
            {
                opacity: 0,

                x: () =>
                    getViewportWidth() * 0.12,

                y: () =>
                    getViewportHeight() * 0.18,

                scale: 0.82,

                zIndex: 20,

                transformOrigin:
                    "right bottom"
            }
        );


        /* =================================================
           TIMELINE
        ================================================= */

        const transitionTL =
            gsap.timeline({

                scrollTrigger: {

                    trigger:
                        clientsTransition,

                    start:
                        "top bottom",

                    end: () =>
                        `top top+=${getViewportHeight() * 1.5}`,

                    scrub:
                        1.5,

                    invalidateOnRefresh:
                        true

                }

            });


        /* =================================================
           01 — MODEL ENTER
        ================================================= */

        transitionTL.to(
            model,
            {
                opacity: 1,

                x: 0,

                y: 0,

                scale: 0.98,

                duration: 1,

                ease:
                    "power2.out"
            }
        );


        /* =================================================
           02 — COPY ENTER
        ================================================= */

        transitionTL.to(
            copy,
            {
                opacity: 1,

                x: 0,

                y: 0,

                scale: 0.98,

                duration: 1,

                ease:
                    "power2.out"
            },
            "<"
        );


        /* =================================================
           03 — IMAGE ENTER
        ================================================= */

        transitionTL.to(
            image,
            {
                opacity: 1,

                y: 0,

                scale: 1,

                filter:
                    "blur(0px)",

                duration: 1.2,

                ease:
                    "power2.out"
            },
            "<"
        );


        /* =================================================
           04 — FINAL MODEL POSITION
        ================================================= */

        transitionTL.to(
            model,
            {
                x: () =>
                    -getViewportWidth() * 0.01,

                y: () =>
                    -getViewportHeight() * 0.02,

                scale: 1.025,

                duration: 1,

                ease:
                    "sine.inOut"
            }
        );


        /* =================================================
           COPY FOLLOWS MODEL
        ================================================= */

        transitionTL.to(
            copy,
            {
                x: () =>
                    -getViewportWidth() * 0.01,

                y: () =>
                    -getViewportHeight() * 0.02,

                scale: 1.025,

                duration: 1,

                ease:
                    "sine.inOut"
            },
            "<"
        );


        /* =================================================
           IMAGE FOLLOWS MODEL
        ================================================= */

        transitionTL.to(
            image,
            {
                x: () =>
                    -getViewportWidth() * 0.005,

                y: () =>
                    -getViewportHeight() * 0.005,

                scale: 1.01,

                duration: 1,

                ease:
                    "sine.inOut"
            },
            "<"
        );

    }

}


/* =========================================================
   06 — CTA
========================================================= */

const cta =
    $(".cta");


if (cta) {

    const heading =
        $(".cta h2", cta);

    const button =
        $(".cta-button", cta);


    const tl =
        gsap.timeline({

            scrollTrigger: {

                trigger:
                    cta,

                start:
                    "top bottom",

                end:
                    "bottom top",

                scrub:
                    SCROLL_SCRUB,

                invalidateOnRefresh:
                    true

            }

        });


    if (heading) {

        tl.fromTo(
            heading,
            {
                scaleX: 0.72,
                transformOrigin:
                    "left center"
            },
            {
                scaleX: 1,
                ease: "none"
            },
            0
        );

    }


    if (button) {

        tl.fromTo(
            button,
            {
                width: 0,
                overflow: "hidden"
            },
            {
                width: "230px",
                ease: "none"
            },
            0.45
        );

    }

}


/* =========================================================
   FINAL REFRESH
========================================================= */

window.addEventListener(
    "load",
    () => {

        setRealViewport();

        ScrollTrigger.refresh();

    },
    {
        once: true
    }
);


if (document.fonts) {

    document.fonts.ready.then(
        () => {

            setRealViewport();

            ScrollTrigger.refresh();

        }
    );

}
})();
/* =========================================================
   MOCCA — GLOBAL LANGUAGE SYSTEM
   EN ↔ ES

   IMPORTANT:
   - English is always the source language.
   - Translations are NEVER made from previous translations.
   - Original text is stored on every text node.
   - HTML / spans / colours are preserved.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const switcher =
        document.getElementById("languageSwitch");

    if (!switcher) return;


    /* =====================================================
       SWITCH ELEMENTS
    ===================================================== */

    const enLabel =
        switcher.querySelector(".language-en");

    const esLabel =
        switcher.querySelector(".language-es");


    /* =====================================================
       ENGLISH → SPANISH
    ===================================================== */

    const EN_TO_ES = {

        /* =================================================
           GENERAL
        ================================================= */

        "BUSINESS, BRAND & GROWTH STUDIO":
            "ESTUDIO DE MARCA Y CRECIMIENTO",

        "BRAND & GROWTH STUDIO":
            "ESTUDIO DE MARCA Y CRECIMIENTO",

        "STRATEGY":
            "ESTRATEGIA",

        "DESIGN":
            "DISEÑO",

        "DIGITAL":
            "DIGITAL",

        "SCROLL TO BREAK THE GRID":
            "HAZ SCROLL Y ROMPE LA CUADRÍCULA",


        /* =================================================
           ABOUT
        ================================================= */

        "ABOUT":
            "SOBRE MOCCA",

        "WE MAKE THINGS MOVE.":
            "HACEMOS QUE LAS COSAS PASEN.",

        "WE DON'T":
            "NO HACEMOS",

        "DO ORDINARY.":
            "LO DE SIEMPRE.",

        "MOCCA is an independent brand and growth studio.":
            "MOCCA es un estudio independiente de marca y crecimiento.",

        "We give brands personality, build their presence and help them grow through strategy, identity, digital and creative direction.":
            "Damos personalidad a las marcas, construimos su presencia y las hacemos crecer con estrategia, identidad, digital y dirección creativa.",

        "NO":
            "SIN",

        "NOISE.":
            "RUIDO.",

        "JUST":
            "SOLO",

        "MOMENTUM.":
            "IMPULSO.",


        /* =================================================
           SERVICES
        ================================================= */

        "SERVICES":
            "SERVICIOS",

        "WHAT WE DO.":
            "LO QUE HACEMOS.",

        "WHAT":
            "LO QUE",

        "WE DO.":
            "HACEMOS.",

        "BUSINESS":
            "NEGOCIO",

        "BRAND":
            "MARCA",

        "CONTENT":
            "CONTENIDO",

        "GROWTH":
            "CRECIMIENTO",


        /* =================================================
           PROCESS
        ================================================= */

        "PROCESS":
            "PROCESO",

        "THIS IS":
            "ASÍ ES",

        "HOW WE WORK.":
            "CÓMO TRABAJAMOS.",

        "DISCOVER":
            "DESCUBRIR",

        "CREATE":
            "CREAR",

        "LAUNCH":
            "LANZAR",

        "OPTIMIZE":
            "OPTIMIZAR",

        "STEP":
            "PASO",

        "SCROLL TO DESCEND":
            "HAZ SCROLL PARA BAJAR",


        /* =================================================
           CLIENTS
        ================================================= */

        "CLIENTS":
            "CLIENTES",

        "NOT FOR EVERYONE.":
            "NO ES PARA TODO EL MUNDO.",

        "FOR THE AMBITIOUS.":
            "PARA QUIENES QUIEREN MÁS.",

        "WHO WE WORK WITH":
            "CON QUIÉN TRABAJAMOS",

        "BUILDING":
            "CREANDO",

        "WHAT'S NEXT.":
            "LO QUE VIENE.",

        "ENTREPRENEURS":
            "EMPRENDEDORES",

        "PERSONAL BRANDS":
            "MARCAS PERSONALES",

        "SMALL & MEDIUM BUSINESS":
            "PEQUEÑAS Y MEDIANAS EMPRESAS",

        "RESTAURANTS & CAFÉS":
            "RESTAURANTES Y CAFÉS",

        "CLINICS & WELLNESS":
            "CLÍNICAS Y BIENESTAR",

        "STORES & E-COMMERCE":
            "TIENDAS Y E-COMMERCE",

        "LOCAL & PURPOSE-DRIVEN":
            "NEGOCIOS LOCALES CON PROPÓSITO",

        "WHAT WE STAND FOR":
            "LO QUE DEFENDEMOS",

        "BUILT":
            "HECHO",

        "TO MOVE.":
            "PARA AVANZAR.",

        "GOOD WORK":
            "UN BUEN TRABAJO",

        "CHANGES":
            "CAMBIA",

        "THINGS.":
            "LAS COSAS.",


        /* =================================================
           CTA
        ================================================= */

        "START":
            "EMPEZAR",

        "HAVE SOMETHING":
            "¿TIENES ALGO",

        "WORTH BUILDING?":
            "QUE MEREZCA LA PENA?",

        "LET'S":
            "VAMOS",

        "TALK.":
            "A HABLAR.",

        "START A PROJECT":
            "EMPEZAR UN PROYECTO",

        "CONTACT":
            "CONTACTO",


        /* =================================================
           PROCESS DESCRIPTIONS
        ================================================= */

        "We understand the business, the market and the ambition behind it.":
            "Entendemos el negocio, el mercado y lo que quieres conseguir.",

        "We define the direction and choose the right path forward.":
            "Definimos el rumbo y trazamos el camino para avanzar.",

        "We build the identity, content and tools that make it real.":
            "Creamos la identidad, el contenido y las herramientas que dan forma a la idea.",

        "We put everything into motion and take the brand to market.":
            "Ponemos todo en marcha y llevamos la marca al mercado.",

        "We measure, learn and refine everything we have built.":
            "Medimos, aprendemos y mejoramos todo lo que hemos creado.",

        "Every brand starts somewhere. This is how we take an idea from the first thought to something real — through strategy, identity, creation and growth:":
            "Toda marca empieza con una idea. Así la convertimos en algo real — desde la estrategia y la identidad hasta la creación y el crecimiento:",


        /* =================================================
           CLIENT DESCRIPTIONS
        ================================================= */

        "Business ideas & new ventures.":
            "Ideas de negocio y nuevos proyectos.",

        "People turning expertise into a brand.":
            "Profesionales que quieren convertir lo que saben en una marca.",

        "Businesses ready for their next stage.":
            "Negocios preparados para dar el siguiente paso.",

        "Independent spaces with something to say.":
            "Espacios independientes con algo que contar.",

        "Brands built around people and experience.":
            "Marcas que ponen a las personas y la experiencia en el centro.",

        "Physical and digital businesses ready to grow.":
            "Negocios físicos y digitales preparados para crecer.",

        "Businesses with a reason to exist.":
            "Negocios con una razón de ser.",


        /* =================================================
           VALUES
        ================================================= */

        "PERSONALIZED APPROACH":
            "UN ENFOQUE A MEDIDA",

        "Every project is unique, so we create tailored strategies.":
            "Cada proyecto es diferente, por eso diseñamos estrategias a medida.",

        "CREATIVITY WITH STRATEGY":
            "CREATIVIDAD CON RUMBO",

        "Design, content and technology with one goal: results.":
            "Diseño, contenido y tecnología con un objetivo: resultados.",

        "LONG-TERM PARTNERSHIP":
            "RELACIONES A LARGO PLAZO",

        "We're not just providers, we're growth partners.":
            "No buscamos ser un proveedor más, sino un aliado para crecer.",

        "MEASURABLE RESULTS":
            "RESULTADOS MEDIBLES",

        "We measure, analyse and optimise to help your business grow.":
            "Medimos, analizamos y optimizamos para que tu negocio siga creciendo.",


        /* =================================================
           CONTACT
        ================================================= */

        "BACK":
            "VOLVER",

        "06 / CONTACT":
            "06 / CONTACTO",

        "HAVE A PROJECT?":
            "¿TIENES UN PROYECTO?",

        "HAVE A BUSINESS?":
            "¿TIENES UN NEGOCIO?",

        "HAVE AN IDEA?":
            "¿TIENES UNA IDEA?",

        "EMAIL":
            "EMAIL",

        "WHATSAPP":
            "WHATSAPP",

        "INSTAGRAM":
            "INSTAGRAM"

    };


    /* =====================================================
       ORIGINAL TEXT STORAGE
    ===================================================== */

    const originalTexts =
        new WeakMap();


    /* =====================================================
       GET TRANSLATABLE TEXT NODES
    ===================================================== */

    function getTextNodes() {

        const walker =
            document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode(node) {

                        const parent =
                            node.parentElement;

                        if (!parent) {
                            return NodeFilter.FILTER_REJECT;
                        }


                        /* ---------------------------------
                           LANGUAGE SWITCH
                        --------------------------------- */

                        if (
                            parent.closest(
                                "#languageSwitch"
                            )
                        ) {

                            return NodeFilter.FILTER_REJECT;

                        }


                        /* ---------------------------------
                           NON CONTENT
                        --------------------------------- */

                        const tag =
                            parent.tagName;

                        if (
                            tag === "SCRIPT" ||
                            tag === "STYLE" ||
                            tag === "NOSCRIPT"
                        ) {

                            return NodeFilter.FILTER_REJECT;

                        }


                        /* ---------------------------------
                           EMPTY
                        --------------------------------- */

                        if (
                            !node.nodeValue ||
                            node.nodeValue.trim() === ""
                        ) {

                            return NodeFilter.FILTER_REJECT;

                        }


                        return NodeFilter.FILTER_ACCEPT;

                    }
                }
            );


        const nodes = [];

        let node;

        while (
            node = walker.nextNode()
        ) {

            nodes.push(node);

        }

        return nodes;

    }


    /* =====================================================
       SAVE ORIGINAL ENGLISH TEXT
    ===================================================== */

    function cacheOriginalText(node) {

        if (
            !originalTexts.has(node)
        ) {

            originalTexts.set(
                node,
                node.nodeValue
            );

        }

        return originalTexts.get(node);

    }


    /* =====================================================
       NORMALIZE
    ===================================================== */

    function normalize(text) {

        return text
            .replace(/\s+/g, " ")
            .trim();

    }


    /* =====================================================
       SORT TRANSLATION KEYS
    ===================================================== */

    const translationKeys =
        Object.keys(EN_TO_ES).sort(
            (a, b) =>
                b.length - a.length
        );


    /* =====================================================
       FIND ENGLISH TRANSLATION
    ===================================================== */

    function translateEnglishText(text) {

        const clean =
            normalize(text);

        if (!clean) {
            return clean;
        }


        /* -----------------------------------------------
           EXACT MATCH FIRST
        ----------------------------------------------- */

        if (
            EN_TO_ES[clean] !== undefined
        ) {

            return EN_TO_ES[clean];

        }


        /* -----------------------------------------------
           PARTIAL PHRASES

           Only replace complete phrases / words.
           This prevents accidental changes inside
           another word.
        ----------------------------------------------- */

        let result =
            clean;


        translationKeys.forEach(key => {

            const escaped =
                key.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );


            const regex =
                new RegExp(
                    `(^|\\s)${escaped}(?=\\s|$)`,
                    "g"
                );


            result =
                result.replace(
                    regex,
                    (match, prefix) =>
                        prefix +
                        EN_TO_ES[key]
                );

        });


        return result;

    }


    /* =====================================================
       FIND SPANISH → ENGLISH

       Reverse map is generated from the ORIGINAL
       English source, but duplicate Spanish values
       are handled deterministically.
    ===================================================== */

    const ES_TO_EN = {};

    Object.entries(EN_TO_ES).forEach(
        ([english, spanish]) => {

            /*
             * Only create reverse mapping when there
             * isn't already one.
             *
             * This prevents later duplicate values
             * from silently overwriting previous ones.
             */

            if (
                ES_TO_EN[spanish] === undefined
            ) {

                ES_TO_EN[spanish] =
                    english;

            }

        }
    );


    const spanishKeys =
        Object.keys(ES_TO_EN).sort(
            (a, b) =>
                b.length - a.length
        );


    /* =====================================================
       FIND SPANISH TRANSLATION
    ===================================================== */

    function translateSpanishText(text) {

        const clean =
            normalize(text);

        if (!clean) {
            return clean;
        }


        /* -----------------------------------------------
           EXACT MATCH
        ----------------------------------------------- */

        if (
            ES_TO_EN[clean] !== undefined
        ) {

            return ES_TO_EN[clean];

        }


        let result =
            clean;


        spanishKeys.forEach(key => {

            const escaped =
                key.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );


            const regex =
                new RegExp(
                    `(^|\\s)${escaped}(?=\\s|$)`,
                    "g"
                );


            result =
                result.replace(
                    regex,
                    (match, prefix) =>
                        prefix +
                        ES_TO_EN[key]
                );

        });


        return result;

    }


    /* =====================================================
       APPLY LANGUAGE
    ===================================================== */

    function applyLanguage(language) {

        const isSpanish =
            language === "es";


        const nodes =
            getTextNodes();


        nodes.forEach(node => {

            /*
             * CRITICAL:
             * Always read the ORIGINAL English text.
             * Never read the currently displayed text.
             */

            const original =
                cacheOriginalText(node);


            const translated =
                isSpanish
                    ? translateEnglishText(original)
                    : normalize(original);


            if (!translated) {
                return;
            }


            /* -------------------------------------------
               Preserve original whitespace
            ------------------------------------------- */

            const leading =
                original.match(/^\s*/)?.[0] || "";

            const trailing =
                original.match(/\s*$/)?.[0] || "";


            node.nodeValue =
                leading +
                translated +
                trailing;

        });


        /* =================================================
           HTML LANG
        ================================================= */

        document.documentElement.lang =
            language;


        /* =================================================
           SWITCH
        ================================================= */

        if (enLabel) {

            enLabel.classList.toggle(
                "active",
                !isSpanish
            );

        }


        if (esLabel) {

            esLabel.classList.toggle(
                "active",
                isSpanish
            );

        }


        switcher.setAttribute(
            "aria-pressed",
            String(isSpanish)
        );


        /* =================================================
           STORAGE
        ================================================= */

        localStorage.setItem(
            "moccaLanguage",
            language
        );


        /* =================================================
           TITLE
        ================================================= */

        document.title =
            isSpanish
                ? "MOCCA — Estudio de Marca y Crecimiento"
                : "MOCCA — Business, Brand & Growth Studio";


        /* =================================================
           SCROLLTRIGGER
        ================================================= */

        if (
            window.ScrollTrigger &&
            typeof ScrollTrigger.refresh === "function"
        ) {

            requestAnimationFrame(() => {

                ScrollTrigger.refresh();

            });

        }

    }


    /* =====================================================
       INITIAL LANGUAGE
    ===================================================== */

    let currentLanguage =
        localStorage.getItem(
            "moccaLanguage"
        );


    if (
        currentLanguage !== "en" &&
        currentLanguage !== "es"
    ) {

        currentLanguage = "en";

    }


    applyLanguage(
        currentLanguage
    );


    /* =====================================================
       SWITCH CLICK
    ===================================================== */

    switcher.addEventListener(
        "click",
        () => {

            const current =
                document.documentElement.lang;


            const next =
                current === "es"
                    ? "en"
                    : "es";


            applyLanguage(next);

        }
    );

});


/* =========================================================
   MOCCA — PAGE TRANSITION
========================================================= */

(function () {

    document.addEventListener("DOMContentLoaded", function () {

        const transition =
            document.querySelector(".mocca-page-transition");


        if (!transition) return;


        /* =====================================================
           CURRENT PAGE
        ===================================================== */

        const currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        const isContact =
            currentPage === "contact.html";


        /* =====================================================
           INITIAL POSITION
        ===================================================== */

        transition.style.transition = "none";


        if (isContact) {

            /*
             * CONTACT
             * Curtain starts above the screen.
             */

            transition.style.transform =
                "translateY(-100%)";

        } else {

            /*
             * HOME
             * Curtain starts below the screen.
             */

            transition.style.transform =
                "translateY(100%)";

        }


        /* =====================================================
           FORCE INITIAL STATE
        ===================================================== */

        transition.offsetHeight;


        /* =====================================================
           LOGO → HOME
           
           DIRECT / SIMPLE
        ===================================================== */

        const logo =
            document.querySelector(".logo");


        if (logo) {

            logo.addEventListener(
                "click",
                function (event) {

                    /*
                     * Only intercept when the logo
                     * actually points to index.html.
                     */

                    const href =
                        logo.getAttribute("href");


                    if (
                        !href ||
                        (
                            !href.endsWith("index.html") &&
                            href !== "./" &&
                            href !== "/"
                        )
                    ) {

                        return;

                    }


                    event.preventDefault();


                    /* =========================================
                       ACTIVATE CURTAIN
                    ========================================= */

                    transition.style.transition =
                        "transform .45s cubic-bezier(.77, 0, .18, 1)";


                    transition.style.transform =
                        "translateY(0)";


                    /* =========================================
                       GO HOME
                    ========================================= */

                    setTimeout(function () {

                        window.location.href =
                            href;

                    }, 450);

                }
            );

        }


        /* =====================================================
           BACK → HOME
        ===================================================== */

        const back =
            document.querySelector(".header-contact");


        if (back) {

            back.addEventListener(
                "click",
                function (event) {

                    const href =
                        back.getAttribute("href");


                    if (
                        !href ||
                        (
                            !href.endsWith("index.html") &&
                            href !== "./" &&
                            href !== "/"
                        )
                    ) {

                        return;

                    }


                    event.preventDefault();


                    /* =========================================
                       ACTIVATE CURTAIN
                    ========================================= */

                    transition.style.transition =
                        "transform .45s cubic-bezier(.77, 0, .18, 1)";


                    transition.style.transform =
                        "translateY(0)";


                    /* =========================================
                       GO HOME
                    ========================================= */

                    setTimeout(function () {

                        window.location.href =
                            href;

                    }, 450);

                }
            );

        }


        /* =====================================================
           HOME → CONTACT
        ===================================================== */

        document
            .querySelectorAll('a[href="contact.html"]')
            .forEach(function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        event.preventDefault();


                        /* =====================================
                           CURTAIN
                        ===================================== */

                        transition.style.transition =
                            "transform .45s cubic-bezier(.77, 0, .18, 1)";


                        transition.style.transform =
                            "translateY(0)";


                        /* =====================================
                           GO CONTACT
                        ===================================== */

                        setTimeout(function () {

                            window.location.href =
                                link.getAttribute("href");

                        }, 450);

                    }
                );

            });

    });

})();