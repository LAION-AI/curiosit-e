console.log("loaded");
const getRelatedArticles = async (title) => {
    const urlencoded = encodeURIComponent(title.split(" ").pop());
    const res = await fetch(
        "http://localhost:3003/related-files?title=" + urlencoded,
    );
    const data = await res.json();
    console.log(data);
    return data;
};

const addRelatedArticles = async () => {
    const title = document.getElementsByTagName("h1")[0].innerText;
    const relatedArticles = await getRelatedArticles(title);
    const relatedArticlesContainer = document.getElementById(
        "related-articles-container",
    );
    const header = document.querySelector("header");
    const ul = document.createElement("ul");
    relatedArticles?.forEach((article) => {
        const articleElement = document.createElement("div");
        articleElement.classList.add("related-article");
        let path = article.replace(
            "/Users/michael/Software/opensource/school-bud-e-frontend/static",
            "",
        );
        path = path.replace(".html", "");

        articleElement.innerHTML = `
        <li>
            <p>${path}</p>
            <a href="${path}">Read more</a>
        </li>
        `;
        // relatedArticlesContainer.appendChild(articleElement);
        ul.appendChild(articleElement);
    });

    header.append(ul);
};

const addQuestionButtons = () => {
    const paragraphs = document.querySelectorAll("#content > p");
    Array.from(paragraphs).forEach((paragraph) => {
        const button = document.createElement("button");
        button.innerHTML = "?";
        button.style.cssText = `
            margin-left: 8px;
            padding: 2px 6px;
            font-size: 12px;
            color: #666;
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
            opacity: 0.6;
            transition: opacity 0.2s;
            z-index: 2;
            position: relative;
        `;

        button.addEventListener("mouseover", () => {
            button.style.opacity = "1";
        });

        button.addEventListener("mouseout", () => {
            button.style.opacity = "0.6";
        });

        button.addEventListener("click", function () {
            if (button.textContent === "?") {
                paragraph.style.filter = "blur(3px)";
                const placeholder = document.createElement("div");
                placeholder.style.cssText = `
                    margin-top: 10px;
                    padding: 10px;
                    background: #f9f9f9;
                    border-left: 3px solid #ddd;
                    font-style: italic;
                `;
                placeholder.textContent =
                    "Practice Question: What are the key points discussed in this paragraph?";
                if (
                    !paragraph.nextElementSibling ||
                    !paragraph.nextElementSibling.classList.contains(
                        "practice-question",
                    )
                ) {
                    paragraph.parentNode.insertBefore(
                        placeholder,
                        paragraph.nextElementSibling,
                    );
                    placeholder.classList.add("practice-question");
                }
                // Change button text to "Show Text"
                button.textContent = "Show Text";
            } else {
                // If button text is "Show Text"
                paragraph.style.filter = "none";
                const placeholder = paragraph.parentNode.querySelector(
                    ".practice-question",
                );
                if (placeholder) {
                    placeholder.remove();
                }
                // Change button text back to "?"
                button.textContent = "?";
            }
        });

        // Insert button after the paragraph
        paragraph.parentNode.insertBefore(button, paragraph.nextSibling);
    });
};

const citationsAkkordeon = () => {
    const citations = document.querySelector(".citations h2");
    const button = document.createElement("button");
    console.log(citations);
    citations.append(button);
    button.textContent = "Toggle"
    const list = document.querySelector("#citation-list");
    list.classList.add("hidden");
    button.addEventListener('click', () => {
        list.classList.toggle("hidden");
    });
};


document.addEventListener("DOMContentLoaded", () => {
    // addRelatedArticles();
    citationsAkkordeon();
    if (innerWidth < 900) {
        addQuestionButtons();
    }
});
