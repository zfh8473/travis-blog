# Epic 7: SEO 和性能优化（SEO & Performance）

实现 SEO 优化（元标签、sitemap、结构化数据）和性能优化（图片优化、懒加载、代码分割）。

## Story 7.1: SEO 元标签优化

As a **blog owner**,  
I want **each article page to have proper SEO meta tags**,  
So that **my blog can be discovered through search engines**.

**Acceptance Criteria:**

**Given** an article exists  
**When** I view the article page  
**Then** the page has proper meta tags (title, description, keywords)  
**And** Open Graph tags are present for social sharing  
**And** Twitter Card tags are present  
**And** the meta tags are unique for each article  
**And** the meta tags are properly formatted

**Prerequisites:** Story 4.2

**Technical Notes:**
- Use Next.js Metadata API or next/head
- Generate dynamic meta tags for each article
- Add Open Graph tags (og:title, og:description, og:image, og:url)
- Add Twitter Card tags
- Use article title and excerpt for meta description
- Add default meta tags for homepage
- Test with social media debuggers (Facebook, Twitter)

---

## Story 7.2: Sitemap 生成

As a **blog owner**,  
I want **the website to have a sitemap.xml**,  
So that **search engines can discover all my articles**.

**Acceptance Criteria:**

**Given** articles exist in the database  
**When** I visit /sitemap.xml  
**Then** I see a valid XML sitemap  
**And** all published articles are listed  
**And** each article has a URL, last modified date, and priority  
**And** the sitemap follows XML sitemap standards

**Prerequisites:** Story 7.1

**Technical Notes:**
- Create sitemap.xml route/page
- Generate sitemap dynamically from database
- Include all published articles
- Add lastmod date (article updated_at)
- Set appropriate priority and changefreq
- Follow XML sitemap protocol
- Submit sitemap to search engines (Google Search Console)

---

## Story 7.3: 结构化数据（Schema.org）

As a **blog owner**,  
I want **article pages to include structured data**,  
So that **search engines can better understand my content**.

**Acceptance Criteria:**

**Given** an article exists  
**When** I view the article page source  
**Then** I see JSON-LD structured data  
**And** the structured data includes article information (title, author, publish date, content)  
**And** the structured data follows Schema.org Article schema  
**And** the structured data is valid

**Prerequisites:** Story 7.2

**Technical Notes:**
- Add JSON-LD script to article pages
- Use Schema.org Article type
- Include required fields: headline, author, datePublished, articleBody
- Optionally include image, category, tags
- Validate structured data with Google Rich Results Test
- Add structured data to homepage (Blog or Website schema)

---

## Story 7.4: 图片优化和懒加载

As a **blog owner**,  
I want **images to be optimized and lazy-loaded**,  
So that **the website loads quickly and performs well**.

**Acceptance Criteria:**

**Given** an article contains images  
**When** I view the article page  
**Then** images are optimized (WebP/AVIF format when supported)  
**And** images are lazy-loaded (load as user scrolls)  
**And** images have proper alt text  
**And** page load time is improved

**Prerequisites:** Story 4.2

**Technical Notes:**
- Use Next.js Image component
- Configure image optimization (WebP, AVIF)
- Implement lazy loading for images
- Add proper alt text to all images
- Optimize image sizes (responsive images)
- Use placeholder images (blur or color)
- Monitor Core Web Vitals (LCP improvement)

---

## Story 7.5: 代码分割和性能优化

As a **blog owner**,  
I want **the website to load quickly**,  
So that **readers have a good experience**.

**Acceptance Criteria:**

**Given** I visit the website  
**When** the page loads  
**Then** the First Contentful Paint (FCP) is < 1.8 seconds  
**And** the Largest Contentful Paint (LCP) is < 2.5 seconds  
**And** the First Input Delay (FID) is < 100ms  
**And** JavaScript is code-split appropriately  
**And** unused code is not loaded

**Prerequisites:** Story 7.4

**Technical Notes:**
- Use Next.js automatic code splitting
- Implement dynamic imports for heavy components
- Optimize bundle size
- Use React.lazy for component lazy loading
- Minimize JavaScript execution time
- Optimize CSS (remove unused styles)
- Monitor performance with Lighthouse
- Implement caching strategies

---

## Story 7.6: 响应式设计完善

As a **blog owner**,  
I want **the website to work well on all devices**,  
So that **all readers can access my content comfortably**.

**Acceptance Criteria:**

**Given** I access the website on desktop (1920x1080)  
**Then** the layout is optimized for desktop  
**Given** I access the website on tablet (768px-1024px)  
**Then** the layout adapts appropriately  
**Given** I access the website on mobile (320px-767px)  
**Then** the layout is mobile-friendly  
**And** all features work correctly on all devices  
**And** text is readable without zooming  
**And** touch targets are appropriately sized

**Prerequisites:** Story 7.5

**Technical Notes:**
- Test on multiple screen sizes
- Use Tailwind CSS responsive utilities
- Implement mobile-first design
- Test touch interactions
- Ensure navigation works on mobile
- Optimize images for different screen sizes
- Test form inputs on mobile
- Verify readability on all devices

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
