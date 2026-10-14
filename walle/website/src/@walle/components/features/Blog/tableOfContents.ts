export interface TocItem {
  id: string;
  text: string;
  element: HTMLElement;
}

export interface TableOfContentsOptions {
  /** CSS selector for headings to include. Default: "h2, h3" */
  headingSelector?: string;
  /** List of CSS selectors; any heading matching one will be excluded */
  excludeSelectors?: string[];
  /** Attribute name for skipping a single heading. Default: data-toc-skip */
  skipAttribute?: string;
  /** Class name for skipping a single heading. Default: toc-skip */
  skipClass?: string;
  /** Container attribute; any heading inside an ancestor with this attribute is skipped. Default: data-toc-skip-container */
  skipContainerAttribute?: string;
  /** Optional text patterns; if heading text matches any pattern it will be excluded */
  excludeTextPatterns?: RegExp[];
  /** Screen-reader labels. No defaults here: callers resolve them through label(). */
  labels?: {
    expanded?: string | null;
    collapsed?: string | null;
    toggle?: string | null;
    /** Template with a `{title}` placeholder. */
    navigateTo?: string | null;
    navigated?: string | null;
  };
}

export class TableOfContentsManager {
  private tocItems: TocItem[] = [];
  private currentActiveIndex = -1;
  private articleContent: HTMLElement | null = null;
  private tocNav: HTMLElement | null = null;
  private tocContainer: HTMLElement | null = null;
  private isScrolling = false;
  private isMobile = false;
  private lastScrollTimestamp = 0;
  private options: TableOfContentsOptions;

  constructor(options: TableOfContentsOptions = {}) {
    this.articleContent = document.getElementById("article-content");
    this.tocNav = document.getElementById("toc-nav");
    this.tocContainer = document.getElementById("toc");
    this.options = {
      headingSelector: "h2, h3",
      skipAttribute: "data-toc-skip",
      skipClass: "toc-skip",
      skipContainerAttribute: "data-toc-skip-container",
      excludeSelectors: [],
      excludeTextPatterns: [],
      ...options,
    };
    this.updateDeviceType();
  }

  public init(): void {
    this.generateTOC();
    this.initNavigationHandlers();
    this.updateActiveTOC();
    this.bindEvents();
  }

  private updateDeviceType(): void {
    this.isMobile = window.innerWidth <= 1024;
  }

  private generateTOC(): void {
    if (!this.articleContent || !this.tocNav || !this.tocContainer) return;
    const headings = this.articleContent.querySelectorAll(this.options.headingSelector || "h2, h3");

    if (headings.length === 0) {
      this.tocContainer.style.display = "none";
      return;
    }

    this.tocNav.classList.add("loading");
    this.tocItems = [];

    const fragment = document.createDocumentFragment();

    headings.forEach((heading, index) => {
      const headingElement = heading as HTMLElement;
      if (this.shouldExcludeHeading(headingElement)) return;
      let id = headingElement.id;

      if (!id) {
        id = this.generateHeadingId(headingElement, index);
        headingElement.id = id;
      }

      const tocItem: TocItem = {
        id,
        text: headingElement.textContent || "",
        element: headingElement,
      };

      this.tocItems.push(tocItem);
      fragment.appendChild(
        this.createTocLink(tocItem, this.tocItems.length - 1, headingElement.tagName)
      );
    });

    this.tocNav.appendChild(fragment);
    this.tocNav.classList.remove("loading");
    this.setupMobileInteraction();
  }

  private shouldExcludeHeading(el: HTMLElement): boolean {
    const {
      skipAttribute,
      skipClass,
      skipContainerAttribute,
      excludeSelectors = [],
      excludeTextPatterns = [],
    } = this.options;

    if (skipAttribute && el.hasAttribute(skipAttribute)) return true;
    if (skipClass && el.classList.contains(skipClass)) return true;

    if (skipContainerAttribute && el.closest(`[${skipContainerAttribute}]`)) return true;

    if (excludeSelectors.some((sel) => el.matches(sel))) return true;

    const text = (el.textContent || "").trim();
    if (excludeTextPatterns.some((re) => re.test(text))) return true;

    return false;
  }

  private generateHeadingId(element: HTMLElement, index: number): string {
    const text = element.textContent || "";
    const level = element.tagName.toLowerCase();
    return `${level}-${index}-${text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50)}`;
  }

  private createTocLink(tocItem: TocItem, index: number, tagName: string): HTMLAnchorElement {
    const link = document.createElement("a");
    link.href = `#${tocItem.id}`;
    link.textContent = tocItem.text;
    link.setAttribute("data-toc-index", index.toString());
    link.setAttribute("data-level", tagName === "H2" ? "2" : "3");
    const navigateTo = this.options.labels?.navigateTo;
    if (navigateTo) link.setAttribute("aria-label", navigateTo.replace("{title}", tocItem.text));
    link.setAttribute("role", "link");

    if (tagName === "H3") {
      link.style.paddingLeft = "2.5rem";
      link.style.fontSize = "0.85rem";
    }

    return link;
  }

  private setupMobileInteraction(): void {
    if (!this.tocContainer) return;

    const tocHeader = this.tocContainer.querySelector("h3");
    if (!tocHeader) return;

    // Replacing the element drops listeners attached by a previous call.
    const newHeader = tocHeader.cloneNode(true) as HTMLElement;
    tocHeader.parentNode?.replaceChild(newHeader, tocHeader);

    if (this.isMobile) {
      this.setupHeaderToggle(newHeader);

      if (this.tocItems.length > 6 || window.innerWidth <= 768) {
        this.tocContainer.classList.add("collapsed");
      }
    }
  }

  private setupHeaderToggle(header: HTMLElement): void {
    let touchStartY = 0;
    let touchStartX = 0;
    let isTap = true;

    const toggleCollapse = () => {
      if (!this.tocContainer) return;

      const isCollapsed = this.tocContainer.classList.contains("collapsed");
      this.tocContainer.classList.toggle("collapsed");

      header.setAttribute("aria-expanded", isCollapsed.toString());

      if ("vibrate" in navigator) {
        navigator.vibrate(30);
      }

      const announcement = isCollapsed
        ? this.options.labels?.expanded || "Table of contents expanded"
        : this.options.labels?.collapsed || "Table of contents collapsed";
      this.announceToScreenReader(announcement);
    };

    // Track touch movement to differentiate tap from scroll
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
      isTap = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX);

      if (deltaY > 10 || deltaX > 10) {
        isTap = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTap) {
        e.preventDefault();
        toggleCollapse();
      }
    };

    header.addEventListener("touchstart", handleTouchStart, { passive: true });
    header.addEventListener("touchmove", handleTouchMove, { passive: true });
    header.addEventListener("touchend", handleTouchEnd, { passive: false });

    header.addEventListener("click", (e) => {
      if (!this.isMobile) return;
      e.preventDefault();
      toggleCollapse();
    });

    header.style.cursor = "pointer";
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", "true");
    header.setAttribute("aria-controls", "toc-nav");
    const toggle = this.options.labels?.toggle;
    if (toggle) header.setAttribute("aria-label", toggle);

    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleCollapse();
      }
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const isCollapsed = this.tocContainer?.classList.contains("collapsed");
          header.setAttribute("aria-expanded", (!isCollapsed).toString());
        }
      });
    });

    if (this.tocContainer) {
      observer.observe(this.tocContainer, { attributes: true });
    }
  }

  private initNavigationHandlers(): void {
    if (!this.tocNav) return;

    this.tocNav.addEventListener(
      "click",
      (e) => {
        const target = e.target as HTMLElement;

        if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
          e.preventDefault();
          e.stopPropagation();

          const targetId = target.getAttribute("href")?.substring(1);
          const targetElement = document.getElementById(targetId || "");

          if (targetElement) {
            target.classList.add("navigating");

            if (this.isMobile && this.tocContainer) {
              this.tocContainer.classList.add("collapsed");

              // Let the collapse animation start before scrolling.
              setTimeout(() => {
                this.scrollToElement(targetElement, target);
              }, 150);
            } else {
              this.scrollToElement(targetElement, target);
            }
          }
        }
      },
      { passive: false }
    );
  }

  private scrollToElement(element: HTMLElement, link: HTMLElement): void {
    const now = Date.now();
    if (this.isScrolling && now - this.lastScrollTimestamp > 3000) this.isScrolling = false;
    if (this.isScrolling) return;

    this.isScrolling = true;
    this.lastScrollTimestamp = now;

    setTimeout(() => {
      if (this.isScrolling) this.isScrolling = false;
    }, 3000);
    const offset = this.getDynamicOffset();

    // Mobile: scrollIntoView, then correct for the sticky header offset.
    if (this.isMobile) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        window.scrollBy(0, -offset);
        this.onScrollComplete(link);
      }, 320);
      return;
    }

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const elementTop = rect.top + scrollTop;
    const targetPosition = elementTop - offset;

    link.classList.add("navigating");

    if ("scrollBehavior" in document.documentElement.style) {
      window.scrollTo({ top: targetPosition, behavior: "smooth" });

      setTimeout(() => {
        const currentPos = window.scrollY;
        if (Math.abs(currentPos - targetPosition) < 4) {
          window.scrollTo({ top: targetPosition, behavior: "auto" });
          this.onScrollComplete(link);
        }
      }, 240);

      if ("onscrollend" in window) {
        const handleScrollEnd = () => {
          window.removeEventListener("scrollend", handleScrollEnd);
          this.onScrollComplete(link);
        };
        window.addEventListener("scrollend", handleScrollEnd, { once: true });
      } else {
        this.waitForScrollEnd(() => {
          this.onScrollComplete(link);
        });
      }
    } else {
      window.scrollTo(0, targetPosition);
      this.onScrollComplete(link);
    }
  }

  /** Fallback for browsers without the scrollend event. */
  private waitForScrollEnd(callback: () => void): void {
    let lastScrollTop = window.pageYOffset;
    let scrollCheckCount = 0;
    const maxChecks = 50; // Max 2.5 seconds (50 * 50ms)

    const checkScroll = () => {
      const currentScrollTop = window.pageYOffset;
      scrollCheckCount++;

      if (Math.abs(currentScrollTop - lastScrollTop) < 1) {
        callback();
      } else if (scrollCheckCount < maxChecks) {
        lastScrollTop = currentScrollTop;
        setTimeout(checkScroll, 50);
      } else {
        callback();
      }
    };

    setTimeout(checkScroll, 50);
  }

  private onScrollComplete(link: HTMLElement): void {
    this.isScrolling = false;
    link.classList.remove("navigating");
    if (this.isMobile) this.announceToScreenReader(this.options.labels?.navigated || "");
    // Mark the clicked target active without waiting for the scroll handler.
    const targetId = link.getAttribute("href")?.substring(1);
    if (targetId) {
      const idx = this.tocItems.findIndex((i) => i.id === targetId);
      if (idx !== -1 && idx !== this.currentActiveIndex) {
        this.updateActiveLinks(idx);
        this.currentActiveIndex = idx;
      }
    }
  }

  /** Mobile: the first heading's scroll-margin-top, else fixed fallbacks. */
  private getDynamicOffset(): number {
    if (!this.isMobile) return 120;
    const first = this.tocItems[0]?.element;
    if (first) {
      const sm = parseInt(getComputedStyle(first).scrollMarginTop || "0", 10);
      if (!isNaN(sm) && sm > 0) return sm;
    }
    return 100;
  }

  private updateActiveTOC(): void {
    if (this.tocItems.length === 0 || this.isScrolling) return;

    const scrollTop = window.pageYOffset;
    const offset = this.getDynamicOffset();
    let activeIndex = -1;

    for (let i = 0; i < this.tocItems.length; i++) {
      const element = this.tocItems[i].element;
      const elementTop = element.getBoundingClientRect().top + scrollTop;

      if (elementTop <= scrollTop + offset) {
        activeIndex = i;
      }
    }

    if (activeIndex !== this.currentActiveIndex) {
      this.updateActiveLinks(activeIndex);
      this.currentActiveIndex = activeIndex;
    }
  }

  private updateActiveLinks(activeIndex: number): void {
    const tocLinks = this.tocNav?.querySelectorAll("a");
    if (!tocLinks) return;

    tocLinks.forEach((link, index) => {
      const isActive = index === activeIndex;
      link.classList.toggle("active", isActive);
      link.setAttribute("aria-current", isActive ? "location" : "false");
    });

    if (activeIndex >= 0 && tocLinks[activeIndex] && this.tocNav) {
      const activeLink = tocLinks[activeIndex] as HTMLElement;
      const navRect = this.tocNav.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();

      if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
        activeLink.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }

  private throttle(func: Function, limit: number): Function {
    let inThrottle: boolean;
    return function (this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  private debounce(func: Function, wait: number): Function {
    let timeout: number | null = null;
    return function (this: any, ...args: any[]) {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => func.apply(this, args), wait);
    };
  }

  private announceToScreenReader(message: string): void {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  private bindEvents(): void {
    const throttledScroll = this.throttle(() => {
      this.updateActiveTOC();
    }, 16) as EventListener;

    const debouncedResize = this.debounce(() => {
      this.updateDeviceType();
      this.setupMobileInteraction();
    }, 250) as EventListener;

    window.addEventListener("scroll", throttledScroll, { passive: true });

    window.addEventListener("resize", debouncedResize, { passive: true });

    window.addEventListener("orientationchange", () => {
      setTimeout(() => {
        this.updateDeviceType();
        this.setupMobileInteraction();
      }, 100);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isMobile && this.tocContainer) {
        this.tocContainer.classList.add("collapsed");
        this.announceToScreenReader(
          this.options.labels?.collapsed || "Table of contents collapsed"
        );
      }
    });

    // Block double-tap zoom on TOC links.
    let lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          const target = event.target as HTMLElement;
          if (target.closest(".toc-nav a")) {
            event.preventDefault();
          }
        }
        lastTouchEnd = now;
      },
      { passive: false }
    );
  }
}

const style = document.createElement("style");
style.textContent = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
document.head.appendChild(style);
