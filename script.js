document.addEventListener('DOMContentLoaded', () => {
    const projectsData = [
        {
            title: "JUSTDESIGN.SHOW",
            imagePath: "frames/nobloom",
            totalFrames: 10,
            description: "Designing and coding the website for the Coventry University Graphic Design Graduate Degree Showcase.",
            link: "https://justdesign.show",
            readMoreLink: "#",
            githubLink: "https://github.com/justdesignshow/justdesignshow.github.io",
            color: "#E6F500",
            backgroundColor: "#F5F6E6",
            category: "WEB/UI/UX"
        },
        {
            title: "DEGREE SHOW EXHIBITION",
            imagePath: "frames/exhibition",
            totalFrames: 10,
            description: "Recreating my Graduate Degree Showcase exhibition in 3D using Blender and Unreal Editor. (Ongoing Project)",
            link: "https://www.youtube.com/watch?v=0OYFrGoJCF4",
            readMoreLink: "",
            githubLink: "",
            color: "#E6F500",
            backgroundColor: "#F5F6E6",
            category: "3D"
        },
        {
            title: "COVENTRY AR MAP",
            imagePath: "frames/project5",
            totalFrames: 10,
            description: "An animated, interactive, augmented reality map of the Coventry city centre, including Coventry University.",
            link: "https://raw.githubusercontent.com/jaisinghdhaliwal/LFJGKPOFJ/8d91236b233664d289ff8aa15c32464f4d1ca315/AR%20Map.reality",
            readMoreLink: "",
            githubLink: "",
            color: "#E6F500",
            backgroundColor: "#808080",
            category: "3D"
        },
        {
            title: "EVERYONE EATS",
            imagePath: "frames/everyoneeats",
            totalFrames: 10,
            description: "A movement that aims to tackle hunger on the streets by providing close to expiry food via a smartphone app.",
            link: "#",
            readMoreLink: "",
            githubLink: "",
            color: "#E6F500",
            backgroundColor: "#808080",
            category: "WEB/UI/UX"
        },
        {
            title: "CELL-SHADE LANDSCAPE",
            imagePath: "frames/project4",
            totalFrames: 10,
            description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Eligendi voluptates dicta, temporibus ducimus cum sit.",
            link: "#",
            readMoreLink: "",
            githubLink: "",
            color: "#FABD68",
            backgroundColor: "#79D3DD",
            category: "3D"
        },
        
    ];

    const projectsContainer = document.querySelector('.projects');

    function renderProjects(filterCategory) {
        projectsContainer.innerHTML = ''; // Clear existing projects
        projectsData.forEach((project, index) => {
            if (!filterCategory || project.category === filterCategory) {
                const projectDiv = document.createElement('div');
                projectDiv.classList.add('project');
                projectDiv.id = `project${index}`;

                const sequenceImageDiv = document.createElement('div');
                sequenceImageDiv.id = `sequenceImage${index}`;
                sequenceImageDiv.classList.add('sequence-image');
                sequenceImageDiv.style.backgroundImage = `url(${project.imagePath}1.webp)`;
                sequenceImageDiv.style.backgroundColor = project.backgroundColor;
                projectDiv.appendChild(sequenceImageDiv);

                const titleElement = document.createElement('h2');
                titleElement.textContent = project.title;
                projectDiv.appendChild(titleElement);

                const descriptionElement = document.createElement('p');
                descriptionElement.textContent = project.description;
                projectDiv.appendChild(descriptionElement);

                const buttonsDiv = document.createElement('div');
                buttonsDiv.classList.add('buttons');

                

                if (project.link) {
                    const linkButton = document.createElement('a');
                    linkButton.classList.add('button');
                    linkButton.href = project.link;
                    linkButton.target = '_blank';
                    linkButton.style.background = project.color;
                    linkButton.innerHTML = '<span class="material-symbols-outlined">open_in_new</span>';
                    buttonsDiv.appendChild(linkButton);
                }

                if (project.readMoreLink) {
                    const readMoreButton = document.createElement('a');
                    readMoreButton.classList.add('button');
                    readMoreButton.href = project.readMoreLink;
                    readMoreButton.innerHTML = '<span class="material-symbols-outlined">description</span>';
                    buttonsDiv.appendChild(readMoreButton);
                }

                if (project.githubLink) {
                    const githubButton = document.createElement('a');
                    githubButton.classList.add('button');
                    githubButton.id = 'github';
                    githubButton.href = project.githubLink;
                    githubButton.setAttribute('aria-label', 'GitHub');
                    githubButton.target = '_blank';
                    githubButton.innerHTML = '<span class="material-symbols-outlined">code</span>';
                    buttonsDiv.appendChild(githubButton);
                }

                projectDiv.appendChild(buttonsDiv);
                projectsContainer.appendChild(projectDiv);

                // Interactive image sequence logic
                const imageElement = sequenceImageDiv;
                const totalFrames = project.totalFrames;
                const imagePath = project.imagePath;
                const imageExtension = '.webp';
                let currentFrame = 1;
                let targetFrame = 1;

                function changeFrame() {
                    if (currentFrame !== targetFrame) {
                        const step = targetFrame > currentFrame ? 1 : -1;
                        currentFrame += step;
                        imageElement.style.backgroundImage = `url(${imagePath}${currentFrame}${imageExtension})`;
                        requestAnimationFrame(changeFrame);
                    }
                }

                function preloadImages() {
                    for (let i = 1; i <= totalFrames; i++) {
                        const img = new Image();
                        img.src = `${imagePath}${i}${imageExtension}`;
                    }
                }

                imageElement.addEventListener('mousemove', function (event) {
                    const rect = imageElement.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const width = rect.width;
                    const percentage = x / width;

                    targetFrame = Math.floor(percentage * totalFrames) + 1;
                    if (targetFrame > totalFrames) targetFrame = totalFrames;
                    if (targetFrame < 1) targetFrame = 1;

                    requestAnimationFrame(changeFrame);
                });

                preloadImages();
            }
        });
    }

    renderProjects(); // Initial render of all projects

    const categoryButtons = document.querySelectorAll('.categories button');

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.querySelector('b').textContent;

            // Toggle active class
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                renderProjects(); // Show all projects
            } else {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderProjects(category);
            }
        });
    });
});