window.onload = function() {
    // --- CONTENTFUL CONFIGURATION ---
    const CONTENTFUL_SPACE_ID = 'a36nuntr7dmt';
    const CONTENTFUL_ACCESS_TOKEN = 'Jo7AeC_6K0r_TKOwQWHmiqC2Hm0LW5F5LLlvOpNOrQc';
    
    const contentfulClient = contentful.createClient({
        space: CONTENTFUL_SPACE_ID,
        accessToken: CONTENTFUL_ACCESS_TOKEN,
    });

    // --- FETCH AND RENDER BLOG POSTS ---
    const postsContainer = document.getElementById('blog-posts-container');
    const loadingMessage = document.getElementById('blog-loading-message');
    let allPosts = []; 

    contentfulClient.getEntries({
        content_type: 'blogPortfolio' 
    })
    .then((response) => {
        if(loadingMessage) loadingMessage.style.display = 'none'; 
        allPosts = response.items;
        
        if (allPosts.length === 0) {
             if(postsContainer) postsContainer.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400">No blog posts found.</p>';
             return;
        }

        allPosts.forEach((post, index) => {
            const { title, slug, featuredImage, excerpt } = post.fields;
            const imageUrl = featuredImage ? `https:${featuredImage.fields.file.url}` : 'https://placehold.co/600x400/e2e8f0/2d3748?text=Blog+Post';
            
            const postElement = document.createElement('div');
            postElement.className = 'card overflow-hidden'
            postElement.setAttribute('data-aos', 'zoom-in-up');
            
            postElement.innerHTML = `
                <img src="${imageUrl}" alt="${featuredImage?.fields.description || title}" class="w-full h-48 object-cover">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-2">${title}</h3>
                    <p class="text-gray-700 dark:text-gray-300 mb-4">${excerpt}</p>
                    <button data-post-index="${index}" class="read-more-btn font-semibold text-blue-600 dark:text-blue-400 hover:underline">Read More &rarr;</button>
                </div>
            `;
            if(postsContainer) postsContainer.appendChild(postElement);
        });
        AOS.refresh();
    })
    .catch(error => {
        console.error('Error fetching posts from Contentful:', error);
        if(loadingMessage) loadingMessage.innerText = 'Failed to load blog posts.';
    });

    // --- BLOG POST MODAL LOGIC ---
    const blogModal = document.getElementById('blog-modal');
    const blogModalCloseBtn = blogModal.querySelector('.modal-close');
    
    if(postsContainer) {
        postsContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('read-more-btn')) {
                const postIndex = event.target.dataset.postIndex;
                const post = allPosts[postIndex];
                
                if (post) {
                    const { title, featuredImage, content } = post.fields;
                    const imageUrl = featuredImage ? `https:${featuredImage.fields.file.url}` : '';
                    
                    document.getElementById('blog-modal-title').innerText = title;
                    document.getElementById('blog-modal-image').src = imageUrl;
                    document.getElementById('blog-modal-image').alt = featuredImage?.fields.description || title;
                    
                    const richTextContent = richTextHtmlRenderer.documentToHtmlString(content);
                    document.getElementById('blog-modal-content').innerHTML = richTextContent;
                    
                    blogModal.classList.add('active');
                }
            }
        });
    }


    const closeBlogModal = () => blogModal.classList.remove('active');
    if(blogModalCloseBtn) blogModalCloseBtn.addEventListener('click', closeBlogModal);
    if(blogModal) blogModal.addEventListener('click', (e) => {
        if (e.target === blogModal) {
            closeBlogModal();
        }
    });

    // --- INITIALIZE AOS ---
    AOS.init({ duration: 800, once: true, offset: 50 });

    // --- THEME TOGGLE LOGIC ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');

    if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if(lightIcon) lightIcon.classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        if(darkIcon) darkIcon.classList.remove('hidden');
    }

    if(themeToggleBtn) themeToggleBtn.addEventListener('click', () => {
        if(lightIcon) lightIcon.classList.toggle('hidden');
        if(darkIcon) darkIcon.classList.toggle('hidden');
        if (localStorage.getItem('color-theme')) {
            if (localStorage.getItem('color-theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            }
        } else {
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            }
        }
    });

    // --- PARTICLES.JS LOGIC ---
    if(typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {"particles":{"number":{"value":80,"density":{"enable":true,"value_area":800}},"color":{"value":"#ffffff"},"shape":{"type":"circle","stroke":{"width":0,"color":"#000000"},"polygon":{"nb_sides":5}},"opacity":{"value":0.5,"random":false,"anim":{"enable":false,"speed":1,"opacity_min":0.1,"sync":false}},"size":{"value":3,"random":true,"anim":{"enable":false,"speed":40,"size_min":0.1,"sync":false}},"line_linked":{"enable":true,"distance":150,"color":"#ffffff","opacity":0.4,"width":1},"move":{"enable":true,"speed":6,"direction":"none","random":false,"straight":false,"out_mode":"out","bounce":false,"attract":{"enable":false,"rotateX":600,"rotateY":1200}}},"interactivity":{"detect_on":"canvas","events":{"onhover":{"enable":true,"mode":"repulse"},"onclick":{"enable":true,"mode":"push"},"resize":true},"modes":{"grab":{"distance":400,"line_linked":{"opacity":1}},"bubble":{"distance":400,"size":40,"duration":2,"opacity":8,"speed":3},"repulse":{"distance":200,"duration":0.4},"push":{"particles_nb":4},"remove":{"particles_nb":2}}},"retina_detect":true});
    }


    // --- GITHUB API & PROJECT MODAL LOGIC ---
    async function fetchRepoStats(repoName, statsContainer) {
        try {
            const response = await fetch(`https://api.github.com/repos/${repoName}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            statsContainer.innerHTML = `<span class="flex items-center"><svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>${data.stargazers_count}</span><span class="flex items-center"><svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L3.707 10.707a1 1 0 01-1.414-1.414l6-6z" clip-rule="evenodd"></path></svg>${data.forks_count}</span>`;
        } catch (error) {
            console.error('Failed to fetch repo stats:', error);
            statsContainer.innerHTML = `<span class="text-xs">Stats not available</span>`;
        }
    }

    document.querySelectorAll('.card[data-repo]').forEach(card => {
        const repoName = card.dataset.repo;
        const statsContainer = card.querySelector('.github-stats');
        if (repoName && statsContainer) {
            fetchRepoStats(repoName, statsContainer);
        }
    });
    
    const projectModal = document.getElementById('project-modal');
    const projectModalCloseBtn = projectModal.querySelector('.modal-close');
    const projectData = {
        "Text-to-Image Generator": { description: "This project features a sophisticated machine learning pipeline built with Python, leveraging a Stable Diffusion model. I engineered a novel image encoder that improved generation speed by 20% and reduced computational costs by 10%. It's designed to translate abstract textual concepts into high-resolution, unique images.", tags: ["Python", "Machine Learning", "Stable Diffusion"], codeLink: "#" },
        "YouTube Clone": { description: "A fully interactive and responsive clone of the YouTube website, built from the ground up using HTML, CSS, and JavaScript. The architecture focuses on a user-friendly interface and intuitive navigation, which led to a 15% reduction in bounce rate and a 20% increase in user session duration in testing.", tags: ["HTML", "CSS", "JavaScript", "Responsive Design"], codeLink: "#" },
        "Grid Glider": { description: "A classic implementation of the Snake game using C++ and fundamental data structures. The project includes core mechanics like player movement and collision detection. A key feature is the modular scoring system built with linked lists and hash tables, which enables adaptive difficulty scaling based on player performance.", tags: ["C++", "Data Structures", "Game Development"], codeLink: "https://github.com/Pratik060921/Grid-Glider" }
    };

    document.querySelectorAll('.project-modal-trigger').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.card');
            const title = card.querySelector('h3').innerText;
            const data = projectData[title];
            if (data) {
                document.getElementById('modal-title').innerText = title;
                document.getElementById('modal-description').innerText = data.description;
                document.getElementById('modal-code-link').href = data.codeLink;
                const tagsContainer = document.getElementById('modal-tags');
                tagsContainer.innerHTML = '';
                data.tags.forEach(tag => {
                    const span = document.createElement('span');
                    span.className = 'skill-tag text-sm';
                    span.innerText = tag;
                    tagsContainer.appendChild(span);
                });
                projectModal.classList.add('active');
            }
        });
    });

    const closeProjectModal = () => projectModal.classList.remove('active');
    if(projectModalCloseBtn) projectModalCloseBtn.addEventListener('click', closeProjectModal);
    if(projectModal) projectModal.addEventListener('click', (e) => {
        if (e.target === projectModal) {
            closeProjectModal();
        }
    });
};
