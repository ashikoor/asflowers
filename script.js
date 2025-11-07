// Smooth scroll and animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animation = "fadeInUp 0.6s ease-out forwards"
      observer.unobserve(entry.target)
    }
  })
}, observerOptions)

// Observe article cards and sections
document.querySelectorAll(".article-card, .archive-card, .section-header").forEach((el) => {
  el.style.opacity = "0"
  observer.observe(el)
})

// Form handling
const submissionForm = document.getElementById("submissionForm")
const newsletterForm = document.getElementById("newsletterForm")

if (submissionForm) {
  submissionForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const formData = new FormData(submissionForm)

    console.log("[v0] Form submitted with data:", Object.fromEntries(formData))

    // Show success message
    const submitBtn = submissionForm.querySelector(".submit-btn")
    const originalText = submitBtn.textContent
    submitBtn.textContent = "Thank you for your submission!"
    submitBtn.style.background = "var(--accent)"

    // Reset after 3 seconds
    setTimeout(() => {
      submissionForm.reset()
      submitBtn.textContent = originalText
      submitBtn.style.background = "var(--primary)"
    }, 3000)
  })
}

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault()
    const email = newsletterForm.querySelector('input[type="email"]').value

    console.log("[v0] Newsletter subscription:", email)

    // Show success message
    const submitBtn = newsletterForm.querySelector("button")
    const originalText = submitBtn.textContent
    submitBtn.textContent = "Subscribed!"

    // Reset after 3 seconds
    setTimeout(() => {
      newsletterForm.reset()
      submitBtn.textContent = originalText
    }, 3000)
  })
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({ behavior: "smooth" })
    }
  })
})

// Add scroll effect to navbar
const lastScrollY = window.scrollY
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar")

  if (window.scrollY > 100) {
    navbar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.08)"
  } else {
    navbar.style.boxShadow = "none"
  }
})

// Parallax effect on hero image
const heroImage = document.querySelector(".hero-image")
if (heroImage) {
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY
    if (scrollY < window.innerHeight) {
      heroImage.style.transform = `translateY(${scrollY * 0.5}px)`
    }
  })
}
