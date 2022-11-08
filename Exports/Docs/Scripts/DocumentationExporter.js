const {info, warn} = require('./Logger').logger

exports.documentationExporter = function documentationExporter() {
    let thisObject = {
        docsSchemaDocument: undefined,
        /**
         * {
         *   project: string,
         *   type: string,
         *   category: string,
         *   nodeId: string,
         *   placeholder: {
         *     [key: string]: string
         *   }
         * } cbr
         */
        currentDocumentBeingRendered: undefined,
        /**
         * {
         *   project: string,
         *   type: string,
         *   category: string,
         *   nodeId: string,
         *   placeholder: {
         *     [key: string]: string
         *   }
         * } cbr
         */
        currentBookBeingRendered: undefined,
        currentLanguageCode: undefined,
        render: render,
        initialize: initialize,
        finalize: finalize,
        write: write
    }

    // Should read this from JSON config
    const languagePack = {
        'EN': 'English',
        'ES': 'Spanish',
        'RU': 'Russian',
        'IT': 'Italian',
        'DE': 'German',
        'FR': 'French',
        'CN': 'Simplified Chinese-Mandarin',
        'ID': 'Bahasa',
        'TR': 'Turkish',
        'NL': 'Dutch',
        'AR': 'Arabic',
        'EL': 'Greek'
    }

    let previousDocumentBeingRendered
    let appSchemaDocument
    let paragraphMap
    let document
    let dom

    return thisObject

    function initialize() {
        paragraphMap = new Map()
        dom = new SA.nodeModules.jsDom(SA.nodeModules.fs.readFileSync(ED.indexFile))
        document = dom.window.document
    }

    function write() {
        let filePath = global.env.PATH_TO_PAGES_DIR + '/' + thisObject.currentDocumentBeingRendered.project + '/' + thisObject.currentDocumentBeingRendered.category + '/'
        SA.projects.foundations.utilities.filesAndDirectories.createNewDir(filePath)

        const fileName = thisObject.currentDocumentBeingRendered.type + '.html'
        filePath = filePath + ED.utilities.normaliseStringForLink(fileName)
        SA.nodeModules.fs.writeFileSync(filePath, dom.serialize())
        return filePath
    }

    function finalize() {
        appSchemaDocument = undefined
        thisObject.docsSchemaDocument = undefined
        document = undefined
    }

    async function render() {

        appSchemaDocument = SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.appSchema.get(thisObject.currentDocumentBeingRendered.type)

        getSchemaDocument()
        await buildHtmlPage()

        function getSchemaDocument() {
            switch(thisObject.currentDocumentBeingRendered.category) {
                case 'Node': {
                    thisObject.docsSchemaDocument = SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.docsNodeSchema.get(thisObject.currentDocumentBeingRendered.type)
                    break
                }
                case 'Concept': {
                    thisObject.docsSchemaDocument = SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.docsConceptSchema.get(thisObject.currentDocumentBeingRendered.type)
                    break
                }
                case 'Topic': {
                    thisObject.docsSchemaDocument = SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.docsTopicSchema.get(thisObject.currentDocumentBeingRendered.type)
                    break
                }
                case 'Tutorial': {
                    thisObject.docsSchemaDocument = SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.docsTutorialSchema.get(thisObject.currentDocumentBeingRendered.type)
                    break
                }
                case 'Review': {
                    thisObject.docsSchemaDocument = SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.docsReviewSchema.get(thisObject.currentDocumentBeingRendered.type)
                    break
                }
                case 'Workspace': {
                    thisObject.docsSchemaDocument = SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.workspaceSchema.get(thisObject.currentDocumentBeingRendered.nodeId)
                    break
                }
                case 'Book': {
                    thisObject.docsSchemaDocument = SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.docsBookSchema.get(thisObject.currentDocumentBeingRendered.type)
                    break
                }
            }

            if(thisObject.docsSchemaDocument === undefined) {
                // Use the New Node Template
                let template = {
                    updated: true,
                    type: thisObject.currentDocumentBeingRendered.type,
                    definition: {text: "Write the definition for this " + thisObject.currentDocumentBeingRendered.category + "."},
                    paragraphs: [
                        {
                            style: "Text",
                            text: "To write a definition, please open the main platform. There you will be able to generate a new definition and generate a change request for it to be included in the documentation." // TODO: this should move into a config for language translation
                        }
                    ]
                }

                switch(thisObject.currentDocumentBeingRendered.category) {
                    case 'Node': {
                        SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).array.docsNodeSchema.push(template)
                        SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.docsNodeSchema.set(thisObject.currentDocumentBeingRendered.type, template)
                        break
                    }
                    case 'Concept': {
                        SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).array.docsConceptSchema.push(template)
                        SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.docsConceptSchema.set(thisObject.currentDocumentBeingRendered.type, template)
                        break
                    }
                    case 'Book': {
                        SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).array.docsBookSchema.push(template)
                        SCHEMAS_BY_PROJECT.get(thisObject.currentDocumentBeingRendered.project).map.docsBookSchema.set(thisObject.currentDocumentBeingRendered.type, template)
                        break
                    }
                }

                thisObject.docsSchemaDocument = template
            }
            /* When for any reason the schema document does not have a paragraphs array */
            if(thisObject.docsSchemaDocument.paragraphs === undefined) {
                thisObject.docsSchemaDocument.paragraphs = []
            }
        }

        async function buildHtmlPage() {
            let definitionImagesArray = []
            let hierarchyImagesArray = []
            let orderedTopicPageIndexArray = []
            let orderedTutorialPageIndexArray = []
            let orderedReviewPageIndexArray = []
            let HTML = ''

            HTML = HTML + '<section id="docs-search-results-div" class="docs-search-page-container">'
            HTML = HTML + '<div class="docs-search-results-header">'
            HTML = HTML + '<div class="docs-image-logo-search-results"><img src="' + ED.utilities.normaliseInternalLink(['Images', 'superalgos-logo.png']) + '" width=200></div>'
            HTML = HTML + '<div class="docs-search-results-box">'
            HTML = HTML + '<input class="docs-search-input" placeholder="search the docs or run a command" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></input>'
            HTML = HTML + '</div>'
            HTML = HTML + '</div>'
            HTML = HTML + '</section>'

            HTML = HTML + '<div id="docs-common-style-container-div" class="docs-common-style-container">' // Common Style Container Starts
            HTML = HTML + '<div id="docs-context-menu-clickeable-div" class="docs-context-menu-clickeable-container">' // Clickable Container Starts

            /* Title */
            let titleLabel = thisObject.docsSchemaDocument.type
            HTML = HTML + '<div id="docs-main-title-div" class="docs-title-table"><div class="docs-table-cell"><h2 class="docs-h2" id="' + thisObject.currentDocumentBeingRendered.type.toLowerCase().replace(' ', '-') + '" > ' + titleLabel + '</h2></div><div id="projectImageDiv" class="docs-image-container"/></div></div>'

            HTML = HTML + addDefinitionTable(thisObject.docsSchemaDocument, 'definition-editable-', thisObject.currentDocumentBeingRendered.category, thisObject.currentDocumentBeingRendered.project, thisObject.currentDocumentBeingRendered.type)

            let editableParagraphIndex = 0
            let autoGeneratedParagraphIndex = 0

            HTML = HTML + await addContent()

            HTML = HTML + '</div>' // Clickeable Container Ends

            generateNavigationAndTableOfContents()

            HTML = HTML + '</div>' // Common Style Container Ends

            /*
            Here we inject the HTML we built into the DOM at the Docs Space Div.
            */
            let docsContentDiv = document.getElementById('docs-content-div')
            docsContentDiv.innerHTML = HTML + addFooter()
            // Create tooltip objects for all the elements
            // tippy('#tooltip-container', {
            //     theme: "superalgos"
            // });

            // hightlightEmbeddedCode()
            // TODO: disabling search box detection for now
            // UI.projects.education.spaces.docsSpace.mainSearchPage.detectEnterOnSearchBox()

            /*
            After generating the html, we will add the images at all the points we know
            there are images to be added.
            */
            addImages()

            function generateNavigationAndTableOfContents() {
                if(thisObject.currentDocumentBeingRendered.category === 'Topic') {

                    orderedTopicPageIndexArray = ED.utilities.buildOrderedPageIndex(
                        thisObject.currentDocumentBeingRendered.project,
                        'Topic',
                        thisObject.docsSchemaDocument.topic
                    )

                    /* Topic Title 
    
                    titleLabel = thisObject.docsSchemaDocument.topic + ' Topic Navigation'
                    HTML = HTML + '<div id="docs-main-title-div" class="docs-title-table"><div class="docs-table-cell"><h2 class="docs-h2" id="' + thisObject.currentDocumentBeingRendered.type.toLowerCase().replace(' ', '-') + '" > ' + titleLabel + '</h2></div><div id="projectImageDiv" class="docs-image-container"/></div></div>'
    
                    */
                    generateTopicPreviousAndNextPageNavigation()

                    HTML = HTML + '<div class="docs-topic-index">' // Container for Topic Navigation including buttons, title and index

                    HTML = HTML + '<h3 class="docs-h3">' + thisObject.docsSchemaDocument.topic + ' &mdash; TOC</h3>'

                    HTML = HTML + '<p style="margin-bottom: 15px;">You just read page <strong>' + thisObject.docsSchemaDocument.pageNumber + '</strong> in the topic.</p>'

                    HTML = HTML + generateTopicMultiPageIndex()

                    HTML = HTML + '</div>'  // END Container for Topic Navigation
                }

                if(thisObject.currentDocumentBeingRendered.category === 'Tutorial') {

                    orderedTutorialPageIndexArray = ED.utilities.buildOrderedPageIndex(
                        thisObject.currentDocumentBeingRendered.project,
                        'Tutorial',
                        thisObject.docsSchemaDocument.tutorial
                    )

                    /* Tutorial Title 
                    titleLabel = thisObject.docsSchemaDocument.tutorial + ' Tutorial Navigation'
                    HTML = HTML + '<div id="docs-main-title-div" class="docs-title-table"><div class="docs-table-cell"><h2 class="docs-h2" id="' + thisObject.currentDocumentBeingRendered.type.toLowerCase().replace(' ', '-') + '" > ' + titleLabel + '</h2></div><div id="projectImageDiv" class="docs-image-container"/></div></div>'
                    */

                    generateTutorialPreviousAndNextPageNavigation()

                    HTML = HTML + '<div class="docs-topic-index">' // Container for Tutorial Navigation including buttons, title and index

                    HTML = HTML + '<h3 class="docs-h3">' + thisObject.docsSchemaDocument.tutorial + ' &mdash; TOC</h3>'

                    HTML = HTML + '<p style="margin-bottom: 15px;">You just did step <strong>' + thisObject.docsSchemaDocument.pageNumber + '</strong> in the tutorial.</p>'

                    HTML = HTML + generateTutorialMultiPageIndex()

                    HTML = HTML + '</div>'  // END Container for Tutorial Navigation
                }

                if(thisObject.currentDocumentBeingRendered.category === 'Review') {

                    orderedReviewPageIndexArray = ED.utilities.buildOrderedPageIndex(
                        thisObject.currentDocumentBeingRendered.project,
                        'Review',
                        thisObject.docsSchemaDocument.review
                    )

                    /* Review Title 
                    titleLabel = thisObject.docsSchemaDocument.review + ' Review Navigation'
                    HTML = HTML + '<div id="docs-main-title-div" class="docs-title-table"><div class="docs-table-cell"><h2 class="docs-h2" id="' + thisObject.currentDocumentBeingRendered.type.toLowerCase().replace(' ', '-') + '" > ' + titleLabel + '</h2></div><div id="projectImageDiv" class="docs-image-container"/></div></div>'
                    */

                    generateReviewPreviousAndNextPageNavigation()

                    HTML = HTML + '<div class="docs-topic-index">' // Container for Review Navigation including buttons, title and index

                    HTML = HTML + '<h3 class="docs-h3">' + thisObject.docsSchemaDocument.review + ' &mdash; TOC</h3>'

                    HTML = HTML + '<p style="margin-bottom: 15px;">You just read page <strong>' + thisObject.docsSchemaDocument.pageNumber + '</strong> of this review collection.</p>'

                    HTML = HTML + generateReviewMultiPageIndex()

                    HTML = HTML + '</div>'  // END Container for Review Navigation
                }
            }

            function addDefinitionTable(docsSchemaDocument, idPrefix, category, project, type) {
                let html = ''
                if(docsSchemaDocument.definition === undefined) {
                    docsSchemaDocument.definition = {
                        text: "Right click and select the pencil button to edit this tex. Replace it with a definition / summary. Hit ESC to exit edit mode."
                    }
                }

                let definitionText = ED.utilities.getTextBasedOnLanguage(docsSchemaDocument.definition, thisObject.currentLanguageCode)
                definitionText = definitionText + ED.utilities.addWarningIfTranslationIsOutdated(docsSchemaDocument.definition, thisObject.currentLanguageCode)

                /* We will test if we can draw an image here or not*/
                let testElement
                if(docsSchemaDocument.definition.icon !== undefined) {
                    testElement = ED.designSpace.getIconByProjectAndName(docsSchemaDocument.definition.icon.project, docsSchemaDocument.definition.icon.name)
                } else {
                    testElement = ED.designSpace.getIconByProjectAndType(project, type)
                }

                /* 
                For nodes we always render a Definition Table, since we assume 
                each node will have an icon. For the rest only if we could load an 
                image we use a table, otherwise we will render the definitaion as a Summary.
                */
                if((category === 'Topic' || category === 'Tutorial' || category === 'Review' || category === 'Concept' || category === 'Book') && testElement === undefined) {
                    html = html + '<div id="definition-summary-editable-paragraph" class="docs-summary"><b>Summary:</b> ' + ED.utilities.addToolTips(definitionText, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project) + '</div>'
                } else {
                    html = html + '<div class="docs-definition-table">'

                    let imageItem = {
                        div: 'definition-image-div-' + definitionImagesArray.length,
                        project: project,
                        category: category,
                        type: type,
                        icon: docsSchemaDocument.definition.icon // if exists, this will override the default that is taking the image from the doc project / type.
                    }
                    definitionImagesArray.push(imageItem)

                    html = html + '<div id="' + imageItem.div + '" class="docs-image-container"></div>'
                    html = html + '<div id="' + idPrefix + 'paragraph" class="docs-definition-text"><strong>' + ED.utilities.addToolTips(definitionText, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project) + '</strong></div>'
                    html = html + '</div>'
                }
                return html
            }

            function generateTopicPreviousAndNextPageNavigation() {
                for(let i = 0; i < orderedTopicPageIndexArray.length; i++) {
                    let arrayItem = orderedTopicPageIndexArray[i]

                    if(thisObject.docsSchemaDocument.type === arrayItem.type) {
                        generateNavigationLinks(orderedTopicPageIndexArray[i - 1], orderedTopicPageIndexArray[i + 1], 'Topic')
                        return
                    }
                }
            }

            /**
             * 
             * @returns {string}
             */
            function generateTopicMultiPageIndex() {
                /* 
                We will go through all the schema documents array for the current project and pick
                the documents that share the same key that the document we are rendering now.
                With the info on those picked document we will build the index.
                */
                let html = ''
                for(let i = 0; i < orderedTopicPageIndexArray.length; i++) {
                    let arrayItem = orderedTopicPageIndexArray[i]
                    autoGeneratedParagraphIndex++
                    html = html + `<p>${arrayItem.pageNumber}.${generateUnstyledLink('Topic', arrayItem.type, arrayItem.type)}</p>`
                }
                return html
            }

            function generateTutorialPreviousAndNextPageNavigation() {
                for(let i = 0; i < orderedTutorialPageIndexArray.length; i++) {
                    let arrayItem = orderedTutorialPageIndexArray[i]

                    if(thisObject.docsSchemaDocument.type === arrayItem.type) {
                        generateNavigationLinks(orderedTutorialPageIndexArray[i - 1], orderedTutorialPageIndexArray[i + 1], 'Tutorial')
                        return
                    }
                }
            }

            /**
             * 
             * @returns {string}
             */
            function generateTutorialMultiPageIndex() {
                /* 
                We will go through all the schema documents array for the current project and pick
                the documents that share the same key that the document we are rendering now. 
                With the info on those picked document we will build the index.
                */
                let html = ''
                for(let i = 0; i < orderedTutorialPageIndexArray.length; i++) {
                    let arrayItem = orderedTutorialPageIndexArray[i]
                    autoGeneratedParagraphIndex++
                    html = html + `<p>${arrayItem.pageNumber}.${generateUnstyledLink('Tutorial', arrayItem.type, arrayItem.type)}</p>`
                }
                return html
            }

            function generateReviewPreviousAndNextPageNavigation() {
                for(let i = 0; i < orderedReviewPageIndexArray.length; i++) {
                    let arrayItem = orderedReviewPageIndexArray[i]

                    if(thisObject.docsSchemaDocument.type === arrayItem.type) {
                        generateNavigationLinks(orderedTutorialPageIndexArray[i - 1], orderedTutorialPageIndexArray[i + 1], 'Review')
                        return
                    }
                }
            }

            /**
             * 
             * @returns {string}
             */
            function generateReviewMultiPageIndex() {
                /* 
                We will go through all the schema documents array for the current project and pick
                the documents that share the same key that the document we are rendering now.
                With the info on those picked document we will build the index.
                */
                let html = ''
                for(let i = 0; i < orderedReviewPageIndexArray.length; i++) {
                    let arrayItem = orderedReviewPageIndexArray[i]
                    autoGeneratedParagraphIndex++
                    html = html + `<p>${arrayItem.pageNumber}.${generateUnstyledLink('Review', arrayItem.type, arrayItem.type)}</p>`
                }
                return html
            }

            /**
             * @returns {Promise<string>} message for logging when complete
             */
            async function addContent() {
                let contentHTML = '<div id="docs-content">'
                if(thisObject.docsSchemaDocument.paragraphs !== undefined) {
                    for(let i = 0; i < thisObject.docsSchemaDocument.paragraphs.length; i++) {
                        let key = 'editable-paragraph-' + editableParagraphIndex
                        let paragraph = thisObject.docsSchemaDocument.paragraphs[i]

                        switch(paragraph.style) {
                            case "Include": {
                                contentHTML = contentHTML + await renderParagraph(paragraph, key)
                                editableParagraphIndex++
                                const result = await addIncludedParagraphs(paragraph.text)
                                if(result.html !== undefined) {
                                    contentHTML = contentHTML + result.html
                                }
                                if(result.error !== undefined) {
                                    paragraph = {
                                        style: "Error",
                                        text: result.error
                                    }
                                    key = 'error-paragraph-' + autoGeneratedParagraphIndex
                                    contentHTML = contentHTML + await renderParagraph(paragraph, key)
                                    autoGeneratedParagraphIndex++
                                }
                                break
                            }
                            case "Placeholder": {
                                contentHTML = contentHTML + await renderParagraph(paragraph, key)
                                editableParagraphIndex++
                                const result = await addPlaceholdedParagraph(paragraph.text)
                                if(result.html !== undefined) {
                                    contentHTML = contentHTML + result.html
                                }
                                if(result.error !== undefined) {
                                    paragraph = {
                                        style: "Note",
                                        text: result.error
                                    }
                                    key = 'note-paragraph-' + autoGeneratedParagraphIndex
                                    contentHTML = contentHTML + await renderParagraph(paragraph, key)
                                    autoGeneratedParagraphIndex++
                                }
                                break
                            }
                            case "Chapter": {
                                contentHTML = contentHTML + await renderParagraph(paragraph, key)
                                editableParagraphIndex++
                                const result = await addChapterIndex(paragraph.text)
                                if(result.html !== undefined) {
                                    contentHTML = contentHTML + result.html
                                }
                                if(result.error !== undefined) {
                                    paragraph = {
                                        style: "Error",
                                        text: result.error
                                    }
                                    key = 'error-paragraph-' + autoGeneratedParagraphIndex
                                    contentHTML = contentHTML + await renderParagraph(paragraph, key)
                                    autoGeneratedParagraphIndex++
                                }
                                break
                            }
                            default: {
                                contentHTML = contentHTML + await renderParagraph(paragraph, key)
                                editableParagraphIndex++
                            }
                        }
                    }
                }
                if(thisObject.currentDocumentBeingRendered.category === 'Node') {
                    contentHTML = contentHTML + await autoGeneratedHtml()
                }
                return contentHTML + '</div>' // Content Ends

                /**
                 * 
                 * @param {string} includeText 
                 * @returns {Promise<{
                 *   html: string?,
                 *   error: string?
                 * }>}
                 */
                async function addIncludedParagraphs(includeText) {
                    let splittedIncludeText = includeText.split('->')
                    let project = splittedIncludeText[0]
                    let category = splittedIncludeText[1]
                    let type = splittedIncludeText[2]
                    let block
                    let definition = false
                    let html = ''
                    if(splittedIncludeText[3] === 'Definition') {
                        definition = true
                    } else {
                        block = splittedIncludeText[3]
                    }
                    let includedSchemaDocument

                    let projectSchema = SCHEMAS_BY_PROJECT.get(project)
                    if(projectSchema === undefined) {
                        projectSchema = await ED.schemas.convertProjectsToSchemas(project).then(() => SCHEMAS_BY_PROJECT.get(project))
                    }
                    if(projectSchema === undefined) {
                        return {error: 'Include paragraph style Syntax Error. The Project <i>' + project + '</i> could not be found. Check the Docs Include Style Syntax to learn how to include blocks from a page. This error message will disappear as soon as you fix the problem.'}
                    }
                    switch(category) {
                        case 'Node': {
                            includedSchemaDocument = projectSchema.map.docsNodeSchema.get(type)
                            break
                        }
                        case 'Concept': {
                            includedSchemaDocument = projectSchema.map.docsConceptSchema.get(type)
                            break
                        }
                        case 'Topic': {
                            includedSchemaDocument = projectSchema.map.docsTopicSchema.get(type)
                            break
                        }
                        case 'Tutorial': {
                            includedSchemaDocument = projectSchema.map.docsTutorialSchema.get(type)
                            break
                        }
                        case 'Review': {
                            includedSchemaDocument = projectSchema.map.docsReviewSchema.get(type)
                            break
                        }
                        case 'Book': {
                            includedSchemaDocument = projectSchema.map.docsBookSchema.get(type)
                            break
                        }
                        default:
                            return {error: 'Category (' + category + ') is not valid. Use Node, Concept, Topic, Review or Book instead.'}
                    }
                    if(includedSchemaDocument === undefined) {
                        return {error: category + ' document ' + type + ' not found at project ' + project}
                    }
                    if(includedSchemaDocument.paragraphs === undefined) {
                        return {error: 'Schema Document found, but without paragraphs.'}
                    }

                    if(definition === true) {
                        html = html + addDefinitionTable(includedSchemaDocument, 'definition-included-', category, project, type)
                    } else {
                        let blockFound = false
                        for(let i = 0; i < includedSchemaDocument.paragraphs.length; i++) {

                            let key = 'included-paragraph-' + autoGeneratedParagraphIndex
                            let paragraph = includedSchemaDocument.paragraphs[i]

                            if(blockFound === false) {
                                if(paragraph.style === "Block" && paragraph.text === block) {
                                    blockFound = true
                                }
                            } else {
                                if(paragraph.style === "Block") {
                                    return {}
                                }
                                if(paragraph.style === "Include") {
                                    html = html + await renderParagraph(paragraph, key)
                                    autoGeneratedParagraphIndex++
                                    const result = await addIncludedParagraphs(paragraph.text)
                                    if(result.html !== undefined) {
                                        html = html + result.html
                                    }
                                    if(result.error !== undefined) {
                                        paragraph = {
                                            style: "Error",
                                            text: result.error
                                        }
                                        key = 'error-paragraph-' + autoGeneratedParagraphIndex
                                        html = html + await renderParagraph(paragraph, key)
                                        autoGeneratedParagraphIndex++
                                    }
                                } else {
                                    html = html + await renderParagraph(paragraph, key)
                                    autoGeneratedParagraphIndex++
                                }
                            }
                        }
                        if(blockFound === false) {
                            return {error: 'Block <i>' + block + '</i> not found.'}
                        }
                    }
                    return {html}
                }

                /**
                 * 
                 * @param {*} propertyName 
                 * @returns {Promise<{
                 *   html: string?,
                 *   error: string?
                 * }>}
                 */
                async function addPlaceholdedParagraph(propertyName) {
                    if(thisObject.currentDocumentBeingRendered.placeholder !== undefined) {
                        let placeholder = thisObject.currentDocumentBeingRendered.placeholder[propertyName]

                        if(placeholder !== undefined) {
                            let paragraph = {
                                style: placeholder.style,
                                text: placeholder.text
                            }
                            let key = 'placeholded-paragraph-' + autoGeneratedParagraphIndex
                            const html = await renderParagraph(paragraph, key)
                            autoGeneratedParagraphIndex++
                            return {html}
                        } else {
                            return {error: 'Property ' + propertyName + ' not found at the placeholder object. This means that within the info received, this information is not available.'}
                        }
                    }
                    return {}
                }

                /**
                 * 
                 * @param {string} chapterText 
                 * @returns {Promise<{
                 *   html: string?, 
                 *   error: string?
                 * }}>} generated chapter HTML
                 */
                async function addChapterIndex(chapterText) {
                    let splittedChapterText = chapterText.split('->')
                    let chapterNumber = splittedChapterText[0]
                    let project = splittedChapterText[1]
                    let category = splittedChapterText[2]
                    let chapterName = splittedChapterText[3]
                    let introText = splittedChapterText[4]
                    let html = ''

                    if(project === undefined || category === undefined || chapterNumber === undefined || chapterName === undefined) {
                        return {error: 'Chapter paragraph style Syntax Error. Some of the required parameters are undefined. Check the Docs Chapter Style Syntax. This error message will disappear as soon as you fix the problem.'}
                    }

                    let projectSchema = SCHEMAS_BY_PROJECT.get(project)
                    if(projectSchema === undefined) {
                        projectSchema = await ED.schemas.convertProjectsToSchemas(project).then(() => SCHEMAS_BY_PROJECT.get(project))
                    }
                    if(projectSchema === undefined) {
                        return {error: 'Chapter paragraph style Syntax Error. The Project <i>' + project + '</i> could not be found. Check the Docs Chapter Style Syntax. This error message will disappear as soon as you fix the problem.'}
                    }

                    if(category !== 'Topic' && category !== 'Tutorial' && category !== 'Review') {
                        return {error: 'Category must be either Topic, Tutorial or Review. Found: <i>' + category + '</i>'}
                    }

                    switch(category) {
                        case 'Topic': {
                            orderedTopicPageIndexArray = ED.utilities.buildOrderedPageIndex(
                                thisObject.currentDocumentBeingRendered.project,
                                'Topic',
                                chapterName
                            )

                            if(orderedTopicPageIndexArray.length === 0) {
                                return {error: 'Chapter paragraph style Syntax Error. The Topic <i>' + chapterName + '</i> could not be found. Check the Docs Chapter Style Syntax. This error message will disappear as soon as you fix the problem.'}
                            }
                            break
                        }
                        case 'Tutorial': {
                            orderedTutorialPageIndexArray = ED.utilities.buildOrderedPageIndex(
                                project,
                                'Tutorial',
                                chapterName
                            )

                            if(orderedTutorialPageIndexArray.length === 0) {
                                return {error: 'Chapter paragraph style Syntax Error. The Tutorial <i>' + chapterName + '</i> could not be found. Check the Docs Chapter Style Syntax. This error message will disappear as soon as you fix the problem.'}
                            }
                            break
                        }
                        case 'Review': {
                            orderedReviewPageIndexArray = ED.utilities.buildOrderedPageIndex(
                                thisObject.currentDocumentBeingRendered.project,
                                'Review',
                                chapterName
                            )

                            if(orderedReviewPageIndexArray.length === 0) {
                                return {error: 'Chapter paragraph style Syntax Error. The Review <i>' + chapterName + '</i> could not be found. Check the Docs Chapter Style Syntax. This error message will disappear as soon as you fix the problem.'}
                            }
                            break
                        }
                    }

                    html = html + '<div class="docs-topic-index">' // Container for Topic Index 

                    let key = 'auto-generated-paragraph-' + autoGeneratedParagraphIndex
                    paragraph = {
                        style: "Title",
                        text: 'Chapter ' + chapterNumber + ' - ' + chapterName
                    }

                    html = html + '<h2>'
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    html = html + '</h2>'

                    if(introText !== undefined) {
                        let key = 'auto-generated-paragraph-' + autoGeneratedParagraphIndex
                        paragraph = {
                            style: "Text",
                            text: introText
                        }
                        html = html + '<p><strong>'
                        html = html + await renderParagraph(paragraph, key)
                        autoGeneratedParagraphIndex++
                        html = html + '</strong></p>'
                    }

                    html = html + '<h3>Table of Contents</h3>'

                    switch(category) {
                        case 'Topic': {
                            html = html + generateTopicMultiPageIndex()
                            break
                        }
                        case 'Tutorial': {
                            html = html + generateTutorialMultiPageIndex()
                            break
                        }
                        case 'Review': {
                            html = html + generateReviewMultiPageIndex()
                            break
                        }
                    }

                    html = html + '</div>'  // Container for Topic Index 
                    return {html}
                }
            }

            function addImages() {
                addProjectImage()
                addDefinitionImage()
                addHierarchyImages()

                if(thisObject.currentDocumentBeingRendered.category === 'Node') {
                    addMenuItemsImages()
                    addChildrenNodesPropertiesImages()
                    addAttachingAndReferencingRulesImages()
                    addConfigurationImages()
                }

                function addDefinitionImage() {

                    for(let i = 0; i < definitionImagesArray.length; i++) {
                        let imageItem = definitionImagesArray[i]
                        let appSchemaDocument = SCHEMAS_BY_PROJECT.get(imageItem.project).map.appSchema.get(imageItem.type)
                        let imageElement
                        if(appSchemaDocument !== undefined && appSchemaDocument.icon === undefined) {
                            /* 
                            We are checking this because there is a possibility that a different icon is specified
                            for this Node Type, in that case we would override the default that is that the icon name is
                            equal to the Node Type.
                            */
                            let imageName = appSchemaDocument.type.toLowerCase().replaceAll(' ', '-')
                            imageElement = ED.designSpace.getIconByProjectAndName(imageItem.project, imageName)
                            if(imageElement === undefined) {
                                warn('Image for project (' + imageItem.project + ') with name (' + imageName + ') not found. As a consequence, the Docs Page will be rendered without the icon. ')
                                continue
                            }
                        } else {
                            if(imageItem.icon === undefined) {
                                /* This is the default behaviours */
                                imageElement = ED.designSpace.getIconByProjectAndType(imageItem.project, imageItem.type)
                                if(imageElement === undefined) {
                                    warn('Image for project (' + imageItem.project + ') with name (' + imageItem.type + ') not found. As a consequence, the Docs Page will be rendered without the icon. ')
                                    continue
                                }
                            } else {
                                /* Here we take the image from the icon specification */
                                imageElement = ED.designSpace.getIconByProjectAndName(imageItem.icon.project, imageItem.icon.name)
                                if(imageElement === undefined) {
                                    warn('Image for project (' + imageItem.icon.project + ') with name (' + imageItem.icon.name + ') not found. As a consequence, the Docs Page will be rendered without the icon. ')
                                    continue
                                }
                            }
                        }
                        imageElement = imageElement.asImageNode(document)
                        imageElement.width = "150"
                        imageElement.height = "150"

                        let definitionImageDiv = document.getElementById(imageItem.div)
                        definitionImageDiv.appendChild(imageElement)
                    }
                }

                function addHierarchyImages() {
                    for(let i = 0; i < hierarchyImagesArray.length; i++) {
                        let imageItem = hierarchyImagesArray[i]
                        let collectionImage

                        if(imageItem.name === undefined) {
                            let appSchemaDocument = SCHEMAS_BY_PROJECT.get(imageItem.project).map.appSchema.get(imageItem.type)
                            if(appSchemaDocument.icon === undefined) {
                                let imageName = appSchemaDocument.type.toLowerCase().replaceAll(' ', '-')
                                collectionImage = ED.designSpace.getIconByProjectAndName(imageItem.project, imageName)
                                if(collectionImage === undefined) {
                                    warn('Image for project (' + imageItem.project + ') with name (' + imageName + ') not found. As a consequence, the hierarchy will be rendered without the icon. ')
                                    continue
                                }
                            } else {
                                collectionImage = ED.designSpace.getIconByProjectAndType(imageItem.project, imageItem.type)
                                if(collectionImage === undefined) {
                                    warn('Image for project (' + imageItem.project + ') with type (' + imageItem.type + ') not found. As a consequence, the hierarchy will be rendered without the icon. ')
                                    continue
                                }
                            }
                        } else {
                            collectionImage = ED.designSpace.getIconByProjectAndName(imageItem.project, imageItem.name)
                            if(collectionImage === undefined) {
                                warn('Image for project (' + imageItem.project + ') with name (' + imageItem.name + ') not found. As a consequence, the hierarchy will be rendered without the icon. ')
                                continue
                            }
                        }

                        let imageElement = collectionImage.asImageNode(document)

                        if(imageItem.size !== undefined) {
                            imageElement.width = imageItem.size
                            imageElement.height = imageItem.size
                        }

                        let hierarchyImageDiv = document.getElementById(imageItem.div)
                        if(hierarchyImageDiv) { // The lower part of the table is filled with spaces that were added to the array but not to the HTML, we can ignore them.
                            hierarchyImageDiv.appendChild(imageElement)

                        }
                    }
                }

                function addProjectImage() {
                    let imageName = thisObject.currentDocumentBeingRendered.project.toLowerCase().replaceAll(' ', '-')
                    let imageElement = ED.designSpace.getIconByProjectAndName(thisObject.currentDocumentBeingRendered.project, imageName)
                    if(imageElement !== undefined) {
                        imageElement = imageElement.asImageNode(document)
                        imageElement.width = "50"
                        imageElement.height = "50"


                        let projectImageDiv = document.getElementById('projectImageDiv')
                        projectImageDiv.appendChild(imageElement)
                    }
                }

                function addMenuItemsImages() {
                    if(appSchemaDocument === undefined || appSchemaDocument.menuItems === undefined) {
                        return
                    }
                    for(let i = 0; i < appSchemaDocument.menuItems.length; i++) {
                        let menuItem = appSchemaDocument.menuItems[i]
                        let collectionImage = getIcon(appSchemaDocument.menuItems[i].relatedUiObjectProject, appSchemaDocument.menuItems[i].actionProject)
                        if(collectionImage === undefined) {
                            continue
                        }
                        let imageElement = collectionImage.asImageNode(document)

                        imageElement.className = "docs-collapsible-image"

                        let parentElement = document.getElementById('docs-menu-item-' + i + '')
                        let dummyImage = parentElement.childNodes[0]
                        parentElement.replaceChild(imageElement, dummyImage)

                        function getIcon(relatedUiObjectProject, actionProject) {
                            let project
                            if(menuItem.relatedUiObject !== undefined) {
                                if(relatedUiObjectProject !== undefined) {
                                    project = relatedUiObjectProject
                                } else {
                                    project = thisObject.currentDocumentBeingRendered.project
                                }
                                return ED.designSpace.getIconByProjectAndType(project, menuItem.relatedUiObject)
                            } else {
                                if(actionProject !== undefined) {
                                    project = actionProject
                                } else {
                                    project = thisObject.currentDocumentBeingRendered.project
                                }
                                if(menuItem.iconPathOn !== undefined) {
                                    return ED.designSpace.getIconByProjectAndName(project, menuItem.iconPathOn)
                                } else {
                                    return ED.designSpace.getIconByProjectAndName('Foundations', 'bitcoin')
                                }
                            }
                        }
                    }
                }

                function addChildrenNodesPropertiesImages() {
                    if(appSchemaDocument === undefined || appSchemaDocument.childrenNodesProperties === undefined) {
                        return
                    }
                    for(let i = 0; i < appSchemaDocument.childrenNodesProperties.length; i++) {
                        let childrenNodesProperty = appSchemaDocument.childrenNodesProperties[i]
                        let collectionImage = getIcon()
                        if(collectionImage === undefined) {
                            continue
                        }
                        let imageElement = collectionImage.asImageNode(document)

                        imageElement.className = "docs-collapsible-image"

                        let parentElement = document.getElementById('docs-children-nodes-property-' + i + '')
                        let dummyImage = parentElement.childNodes[0]
                        parentElement.replaceChild(imageElement, dummyImage)

                        function getIcon() {
                            if(childrenNodesProperty.project !== undefined) {
                                return ED.designSpace.getIconByProjectAndType(childrenNodesProperty.project, childrenNodesProperty.childType)
                            } else {
                                return ED.designSpace.getIconByProjectAndType(thisObject.currentDocumentBeingRendered.project, childrenNodesProperty.childType)
                            }
                        }
                    }
                }

                function addAttachingAndReferencingRulesImages() {
                    if(appSchemaDocument === undefined) {
                        return
                    }

                    if(appSchemaDocument.attachingRules !== undefined) {
                        if(appSchemaDocument.attachingRules.compatibleTypes !== undefined) {
                            let splittedTypes = appSchemaDocument.attachingRules.compatibleTypes.split('->')
                            imageForTheseNodes(splittedTypes, 'attaching-rules-compatible-types')
                        }
                        if(appSchemaDocument.attachingRules.incompatibleTypes !== undefined) {
                            let splittedTypes = appSchemaDocument.attachingRules.incompatibleTypes.split('->')
                            imageForTheseNodes(splittedTypes, 'attaching-rules-incompatible-types')
                        }
                    }
                    if(appSchemaDocument.referencingRules !== undefined) {
                        if(appSchemaDocument.referencingRules.compatibleTypes !== undefined) {
                            let splittedTypes = appSchemaDocument.referencingRules.compatibleTypes.split('->')
                            imageForTheseNodes(splittedTypes, 'referencing-rules-compatible-types')
                        }
                        if(appSchemaDocument.referencingRules.incompatibleTypes !== undefined) {
                            let splittedTypes = appSchemaDocument.referencingRules.incompatibleTypes.split('->')
                            imageForTheseNodes(splittedTypes, 'referencing-rules-incompatible-types')
                        }
                    }

                    function imageForTheseNodes(nodeList, additionToKey) {
                        for(let i = 0; i < nodeList.length; i++) {
                            let listItem = nodeList[i]
                            if(listItem === "") {
                                continue
                            }

                            let collectionImage = getIcon()
                            if(collectionImage === undefined) {
                                continue
                            }
                            let imageElement = collectionImage.asImageNode(document)

                            imageElement.className = "docs-collapsible-image"

                            let parentElement = document.getElementById('docs-' + additionToKey + '-' + i + '')
                            let dummyImage = parentElement.childNodes[0]
                            parentElement.replaceChild(imageElement, dummyImage)

                            function getIcon() {
                                let splittedListItem = listItem.split('|')
                                if(splittedListItem.length === 1) {
                                    return ED.designSpace.getIconByProjectAndType(thisObject.currentDocumentBeingRendered.project, listItem)
                                } else {
                                    let project = splittedListItem[0]
                                    let nodeType = splittedListItem[1]
                                    return ED.designSpace.getIconByProjectAndType(project, nodeType)
                                }
                            }
                        }
                    }
                }

                function addConfigurationImages() {
                    if(appSchemaDocument === undefined) {
                        return
                    }
                    let configImageElementArray = document.getElementsByClassName('docs-configuration-property-image')
                    if(configImageElementArray === undefined) {
                        return
                    }

                    /* 
                    We need to create our own array otherwise while replacing the childElement
                    we will be shrinking the array.
                    */
                    let imageArray = []
                    for(let i = 0; i < configImageElementArray.length; i++) {
                        let dummyImage = configImageElementArray[i]
                        imageArray.push(dummyImage)
                    }
                    for(let i = 0; i < imageArray.length; i++) {
                        let dummyImage = imageArray[i]
                        let parentElement = dummyImage.parentNode
                        let collectionImage = ED.designSpace.getIconByProjectAndName('Foundations', 'configuration')
                        if(collectionImage === undefined) {
                            continue
                        }
                        let imageElement = collectionImage.asImageNode(document)

                        imageElement.className = "docs-collapsible-image"
                        parentElement.replaceChild(imageElement, dummyImage)
                    }
                }
            }

            async function autoGeneratedHtml() {
                return await generateConfiguration() +
                    await generateMenuItems() +
                    await generateChildrenNodesProperties() +
                    await generateAttachingRules() +
                    await generateReferencingRules() +
                    await generateCode() +
                    await generateFormula()

                /**
                 * 
                 * @returns {Promise<string>} generated menu items HTML
                 */
                async function generateMenuItems() {
                    /* 
                    Menu Items
                    */
                    let html = ''
                    let paragraph
                    let key = 'auto-generated-paragraph-' + autoGeneratedParagraphIndex
                    if(appSchemaDocument === undefined || appSchemaDocument.menuItems === undefined || appSchemaDocument.menuItems.length === 0) {
                        return ''
                    }

                    paragraph = {
                        style: "Title",
                        text: "" + appSchemaDocument.type + " Menu"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "The " + appSchemaDocument.type + " node has the following Node Menu items:"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    for(let i = 0; i < appSchemaDocument.menuItems.length; i++) {
                        let menuItem = appSchemaDocument.menuItems[i]

                        html = html + '<button id="docs-menu-item-' + i + '" type="button" class="docs-collapsible-element"><img>' + menuItem.label + '</button>'
                        html = html + '<div class="docs-collapsible-content">'

                        paragraph = {
                            style: "Text",
                            text: 'The ' + menuItem.label + ' menu item has the following properties:'
                        }
                        html = html + await renderParagraph(paragraph, key)
                        autoGeneratedParagraphIndex++

                        for(const property in menuItem) {
                            paragraph = {
                                style: "List",
                                text: property + ": " + menuItem[property]
                            }
                            html = html + await renderParagraph(paragraph, key)
                            autoGeneratedParagraphIndex++
                        }

                        html = html + '</div>'
                    }
                    paragraph = {
                        style: "Success",
                        text: "When a menu item is grayed out, it means that " + appSchemaDocument.type + " already has the required child type that the menu item may add, and only that child is allowed for that case. "
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    return html
                }

                /**
                 * 
                 * @returns {Promise<string>} generated children node properties HTML
                 */
                async function generateChildrenNodesProperties() {
                    /* 
                    Children Nodes Properties
                    */
                    let html = ''
                    let paragraph
                    let key = 'auto-generated-paragraph-' + autoGeneratedParagraphIndex

                    if(appSchemaDocument === undefined || appSchemaDocument.childrenNodesProperties === undefined || appSchemaDocument.childrenNodesProperties.length === 0) {
                        return ''
                    }

                    paragraph = {
                        style: "Title",
                        text: "" + appSchemaDocument.type + " Children"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "The " + appSchemaDocument.type + " node has the following childrenNodesProperties:"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    for(let i = 0; i < appSchemaDocument.childrenNodesProperties.length; i++) {
                        let childrenNodesProperty = appSchemaDocument.childrenNodesProperties[i]

                        let name = ED.utilities.fromCamelCaseToUpperWithSpaces(childrenNodesProperty.name)

                        html = html + '<button id="docs-children-nodes-property-' + i + '" type="button" class="docs-collapsible-element"><img>' + ED.utilities.addToolTips(name, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project) + '</button>'
                        html = html + '<div class="docs-collapsible-content">'

                        paragraph = {
                            style: "Text",
                            text: 'The ' + name + ' node property features the following properties:'
                        }
                        html = html + await renderParagraph(paragraph, key)
                        autoGeneratedParagraphIndex++

                        for(const property in childrenNodesProperty) {
                            paragraph = {
                                style: "List",
                                text: property + ": " + childrenNodesProperty[property]
                            }
                            html = html + await renderParagraph(paragraph, key)
                            autoGeneratedParagraphIndex++
                        }

                        html = html + '</div>'
                    }
                    return html
                }

                /**
                 * 
                 * @returns {Promise<string>} generated attaching rules HTML
                 */
                async function generateAttachingRules() {
                    /* 
                    Attaching Rules
                    */
                    let html = ''
                    let paragraph
                    let key = 'auto-generated-paragraph-' + autoGeneratedParagraphIndex
                    if(appSchemaDocument === undefined || (appSchemaDocument.attachingRules === undefined && appSchemaDocument.referencingRules === undefined)) {
                        return ''
                    }

                    paragraph = {
                        style: "Title",
                        text: "" + appSchemaDocument.type + " Attaching Rules"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "The following are the Node Attaching Rules that govern the attachment of  " + appSchemaDocument.type + " with other nodes:"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    if(appSchemaDocument.attachingRules !== undefined) {
                        if(appSchemaDocument.attachingRules.compatibleTypes !== undefined) {
                            paragraph = {
                                style: "Subtitle",
                                text: "Compatible Types:"
                            }
                            html = html + await renderParagraph(paragraph, key)
                            autoGeneratedParagraphIndex++

                            let splittedTypes = appSchemaDocument.attachingRules.compatibleTypes.split('->')
                            html = html + listAllTheseNodes(splittedTypes, 'attaching-rules-compatible-types')
                        }
                        if(appSchemaDocument.attachingRules.incompatibleTypes !== undefined) {
                            paragraph = {
                                style: "Subtitle",
                                text: "Incompatible Types:"
                            }
                            html = html + await renderParagraph(paragraph, key)
                            autoGeneratedParagraphIndex++

                            let splittedTypes = appSchemaDocument.attachingRules.incompatibleTypes.split('->')
                            html = html + listAllTheseNodes(splittedTypes, 'attaching-rules-incompatible-types')
                        }
                    }
                    return html

                    function listAllTheseNodes(nodeList, additionToKey) {
                        let lHtml = ''
                        for(let i = 0; i < nodeList.length; i++) {
                            let listItem = nodeList[i]
                            if(listItem === "") {
                                continue
                            }
                            lHtml = lHtml + '<button id="docs-' + additionToKey + '-' + i + '" type="button" class="docs-non-collapsible-element"><img>' + ED.utilities.addToolTips(listItem, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project) + '</button>'
                        }
                        return lHtml
                    }
                }

                /**
                 * 
                 * @returns {Promise<string>} generated referencing rules HTML
                 */
                async function generateReferencingRules() {
                    /* 
                    Referencing Rules
                    */
                    let html = ''
                    let paragraph
                    let key = 'auto-generated-paragraph-' + autoGeneratedParagraphIndex
                    if(appSchemaDocument === undefined || (appSchemaDocument.referencingRules === undefined && appSchemaDocument.referencingRules === undefined)) {
                        return ''
                    }

                    paragraph = {
                        style: "Title",
                        text: "" + appSchemaDocument.type + " Referencing Rules"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "The following are the Node Referencing Rules that determine which nodes " + appSchemaDocument.type + " may establish a reference to:"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    if(appSchemaDocument.referencingRules !== undefined) {
                        if(appSchemaDocument.referencingRules.compatibleTypes !== undefined) {
                            paragraph = {
                                style: "Subtitle",
                                text: "Compatible Types:"
                            }
                            html = html + await renderParagraph(paragraph, key)
                            autoGeneratedParagraphIndex++

                            let splittedTypes = appSchemaDocument.referencingRules.compatibleTypes.split('->')
                            html = html + listAllTheseNodes(splittedTypes, 'referencing-rules-compatible-types')
                        }
                        if(appSchemaDocument.referencingRules.incompatibleTypes !== undefined) {
                            paragraph = {
                                style: "Subtitle",
                                text: "Incompatible Types:"
                            }
                            html = html + await renderParagraph(paragraph, key)
                            autoGeneratedParagraphIndex++

                            let splittedTypes = appSchemaDocument.referencingRules.incompatibleTypes.split('->')
                            html = html + listAllTheseNodes(splittedTypes, 'referencing-rules-incompatible-types')
                        }
                    }
                    return html

                    function listAllTheseNodes(nodeList, additionToKey) {
                        let lHtml = ''
                        for(let i = 0; i < nodeList.length; i++) {
                            let listItem = nodeList[i]
                            if(listItem === "") {
                                continue
                            }
                            lHtml = lHtml + '<button id="docs-' + additionToKey + '-' + i + '" type="button" class="docs-non-collapsible-element"><img>' + ED.utilities.addToolTips(listItem, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project) + '</button>'
                        }
                        return lHtml
                    }
                }

                /**
                 * 
                 * @returns {Promise<string>} generated configuration HTML
                 */
                async function generateConfiguration() {
                    /* 
                    Configuration
                    */
                    let html = ''
                    let paragraph
                    let key = 'auto-generated-paragraph-' + autoGeneratedParagraphIndex
                    if(appSchemaDocument === undefined || appSchemaDocument.editors === undefined || appSchemaDocument.editors.config !== true) {
                        return ''
                    }
                    paragraph = {
                        style: "Subtitle",
                        text: "Initial Values"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    if(appSchemaDocument.initialValues === undefined || appSchemaDocument.initialValues.config === undefined) {
                        return ''
                    }

                    paragraph = {
                        style: "Text",
                        text: "These are the Initial Values for " + appSchemaDocument.type + " configuration:"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    let initialValues = JSON.parse(appSchemaDocument.initialValues.config)
                    paragraph = {
                        style: "Json",
                        text: JSON.stringify(initialValues, undefined, 4)
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    paragraph = {
                        style: "Subtitle",
                        text: "Examples"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "This is a list of properties featured by the " + appSchemaDocument.type + " configuration. Expanding a property shows sample values for the property extracted from the current Workspace."
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    /*
                    Here we will scan the whole workspace, first looking for nodes of the same type,
                    and after that, analysing their configuration in order to extract all the properties
                    they are using and sample values for each one.
                    */
                    /* First Step: get an array of all the nodes in the workspace of this type */
                    let rootNodes = [] //ED.designSpace.workspace.workspaceNode.rootNodes
                    let allNodesFound = []
                    for(let i = 0; i < rootNodes.length; i++) {
                        let rootNode = rootNodes[i]
                        if(rootNode !== null) {
                            let nodeArray = ED.utilities.nodeBranchToArray(rootNode, appSchemaDocument.type)
                            allNodesFound = allNodesFound.concat(nodeArray)
                        }
                    }
                    /* Second Step: create a map with all the properties used in configurations of this node type */
                    let propertyMap = new Map()
                    for(let i = 0; i < allNodesFound.length; i++) {
                        let node = allNodesFound[i]
                        let config = {}
                        try {config = JSON.parse(node.config)} catch(e) { }
                        for(const property in config) {
                            let value = JSON.stringify(config[property], undefined, 4)
                            let valueArray = propertyMap.get(property)
                            if(valueArray === undefined) {
                                propertyMap.set(property, [value])
                            } else {
                                if(valueArray.includes(value) === false) {
                                    if(valueArray.length <= 10) {
                                        valueArray.push(value)
                                    }
                                }
                            }
                        }
                    }
                    /* Third Step: we will display the list of properties and the sample values */
                    for(let e of paragraphMap) {
                        html = html + await displayProperty(e[1], e[0])
                    }
                    return html
                    // propertyMap.forEach(displayProperty)

                    async function displayProperty(valueArray, mapKey) {

                        let name = ED.utilities.fromCamelCaseToUpperWithSpaces(mapKey)

                        let pHtml = '<button id="docs-config-property-' + mapKey.toLowerCase() + '" type="button" class="docs-collapsible-element"><img class="docs-configuration-property-image">' + name + '</button>'
                        pHtml = pHtml + '<div class="docs-collapsible-content">'

                        for(let i = 0; i < valueArray.length; i++) {
                            let value = valueArray[i]

                            paragraph = {
                                style: "Json",
                                text: value
                            }
                            pHtml = pHtml + await renderParagraph(paragraph, key)
                            autoGeneratedParagraphIndex++
                        }

                        return pHtml + '</div>'
                    }
                }

                /**
                 * 
                 * @returns {Promise<string>} generated code HTML
                 */
                async function generateCode() {
                    /* 
                    Code
                    */
                    let html = ''
                    let paragraph
                    let key = 'auto-generated-paragraph-' + autoGeneratedParagraphIndex
                    if(appSchemaDocument === undefined || appSchemaDocument.editors === undefined || appSchemaDocument.editors.code !== true) {
                        return ''
                    }
                    paragraph = {
                        style: "Title",
                        text: "" + appSchemaDocument.type + " Code"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "This section explores " + appSchemaDocument.type + " Node Code."
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    if(appSchemaDocument.initialValues === undefined || appSchemaDocument.initialValues.code === undefined) {
                        return ''
                    }

                    paragraph = {
                        style: "Subtitle",
                        text: "Initial Value"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "The initial value for " + appSchemaDocument.type + " Code is:"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    paragraph = {
                        style: "Javascript",
                        text: JSON.stringify(appSchemaDocument.initialValues.code, undefined, 4)
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    paragraph = {
                        style: "Subtitle",
                        text: "Examples"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "This is a list of examples used on the " + appSchemaDocument.type + " code, collected from this workspace."
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    /*
                    Here we will scan the whole workspace, first looking for nodes of the same type,
                    and after that, analysing their code in order to extract examples to show.
                    */
                    /* First Step: get an array of all the nodes in the workspace of this type */
                    let rootNodes = [] //ED.designSpace.workspace.workspaceNode.rootNodes
                    let allNodesFound = []
                    for(let i = 0; i < rootNodes.length; i++) {
                        let rootNode = rootNodes[i]
                        if(rootNode !== null) {
                            let nodeArray = ED.utilities.nodeBranchToArray(rootNode, appSchemaDocument.type)
                            allNodesFound = allNodesFound.concat(nodeArray)
                        }
                    }
                    /* 
                    Second Step: create a map with all the code examples used at this node type,
                    without repeating them.
                    */
                    let codeMap = new Map()
                    for(let i = 0; i < allNodesFound.length; i++) {
                        let node = allNodesFound[i]
                        codeMap.set(node.code, node.code)
                    }
                    /* Third Step: we will display the list of properties and the sample values */
                    let exampleCounter = 1
                    for(let e of codeMap.entries()) {
                        html = html + await displayProperty(e[1])
                    }
                    return html
                    //codeMap.forEach(displayProperty)

                    async function displayProperty(code) {
                        if(exampleCounter > 10) {
                            return ''
                        }
                        let pHtml = '<button id="docs-code-example-' + exampleCounter + '" type="button" class="docs-collapsible-element">' + 'Example #' + exampleCounter + '</button>'
                        pHtml = pHtml + '<div class="docs-collapsible-code-content">'
                        exampleCounter++
                        paragraph = {
                            style: "Javascript",
                            text: code
                        }
                        pHtml = pHtml + await renderParagraph(paragraph, key)
                        autoGeneratedParagraphIndex++

                        return pHtml + '</div>'
                    }
                }

                /**
                 * 
                 * @returns {Promise<string>} generated formula HTML
                 */
                async function generateFormula() {
                    /* 
                    Formula
                    */
                    let html = ''
                    let paragraph
                    let key = 'auto-generated-paragraph-' + autoGeneratedParagraphIndex
                    if(appSchemaDocument === undefined || appSchemaDocument.editors === undefined || appSchemaDocument.editors.formula !== true) {
                        return ''
                    }
                    paragraph = {
                        style: "Title",
                        text: "" + appSchemaDocument.type + " Formula"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "This section explores " + appSchemaDocument.type + " Node Code."
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    if(appSchemaDocument.initialValues === undefined || appSchemaDocument.initialValues.code === undefined) {
                        return ''
                    }

                    paragraph = {
                        style: "Subtitle",
                        text: "Initial Value"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "The initial value for " + appSchemaDocument.type + " is:"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    paragraph = {
                        style: "Javascript",
                        text: JSON.stringify(appSchemaDocument.initialValues.code, undefined, 4)
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++

                    paragraph = {
                        style: "Subtitle",
                        text: "Examples"
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    paragraph = {
                        style: "Text",
                        text: "This is a list of examples used on the " + appSchemaDocument.type + " code, collected from this workspace."
                    }
                    html = html + await renderParagraph(paragraph, key)
                    autoGeneratedParagraphIndex++
                    /*
                    Here we will scan the whole workspace, first looking for nodes of the same type,
                    and after that, analysing their code in order to extract examples to show.
                    */
                    /* First Step: get an array of all the nodes in the workspace of this type */
                    let rootNodes = [] //ED.designSpace.workspace.workspaceNode.rootNodes
                    let allNodesFound = []
                    for(let i = 0; i < rootNodes.length; i++) {
                        let rootNode = rootNodes[i]
                        if(rootNode !== null) {
                            let nodeArray = ED.utilities.nodeBranchToArray(rootNode, appSchemaDocument.type)
                            allNodesFound = allNodesFound.concat(nodeArray)
                        }
                    }
                    /* 
                    Second Step: create a map with all the code examples used at this node type,
                    without repeating them.
                    */
                    let codeMap = new Map()
                    for(let i = 0; i < allNodesFound.length; i++) {
                        let node = allNodesFound[i]
                        codeMap.set(node.code, node.code)
                    }
                    /* Third Step: we will display the list of properties and the sample values */
                    let exampleCounter = 1
                    for(let e of codeMap.entries()) {
                        html = html + await displayProperty(e[1])
                    }
                    //codeMap.forEach(displayProperty)
                    return html

                    async function displayProperty(code) {
                        if(exampleCounter > 10) {
                            return ''
                        }
                        let pHtml = '<button id="docs-code-example-' + exampleCounter + '" type="button" class="docs-collapsible-element">' + 'Example #' + exampleCounter + '</button>'
                        pHtml = pHtml + '<div class="docs-collapsible-code-content">'
                        exampleCounter++
                        paragraph = {
                            style: "Javascript",
                            text: code
                        }
                        pHtml = pHtml + await renderParagraph(paragraph, key)
                        autoGeneratedParagraphIndex++

                        return pHtml + '</div>'
                    }
                }
            }

            /**
             * 
             * @param {any} paragraph 
             * @param {string} key 
             * @returns {Promise<string>}
             */
            async function renderParagraph(paragraph, key) {
                let innerHTML
                let styleClass = ''
                let prefix = ''
                let sufix = ''
                let role = ''

                switch(paragraph.style) {
                    case 'Text': {
                        styleClass = ''
                        prefix = ''
                        role = ''
                        key = key + '-text'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addCodeToCamelCase(innerHTML)
                        innerHTML = ED.utilities.addCodeToWhiteList(innerHTML)
                        innerHTML = ED.utilities.addKeyboard(innerHTML)
                        innerHTML = ED.utilities.addItalics(innerHTML)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Title': {
                        styleClass = 'class="docs-h3"'
                        prefix = ''
                        role = ''
                        key = key + '-title'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Subtitle': {
                        styleClass = 'class="docs-h4"'
                        prefix = ''
                        role = ''
                        key = key + '-subtitle'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Note': {
                        styleClass = 'class="docs-font-small docs-alert-note"'
                        prefix = '<i class="docs-fa docs-note-circle"></i> <b>Note:</b>'
                        role = 'role="alert"'
                        key = key + '-note'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addKeyboard(innerHTML)
                        innerHTML = ED.utilities.addItalics(innerHTML)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Success': {
                        styleClass = 'class="docs-font-small docs-alert-success"'
                        prefix = '<i class="docs-fa docs-check-square-o"></i> <b>Tip:</b>'
                        role = 'role="alert"'
                        key = key + '-success'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addKeyboard(innerHTML)
                        innerHTML = ED.utilities.addItalics(innerHTML)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Important': {
                        styleClass = 'class="docs-font-small docs-alert-important"'
                        prefix = '<i class="docs-fa docs-warning-sign"></i> <b>Important:</b>'
                        role = 'role="alert"'
                        key = key + '-important'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addKeyboard(innerHTML)
                        innerHTML = ED.utilities.addItalics(innerHTML)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Warning': {
                        styleClass = 'class="docs-font-small docs-alert-warning"'
                        prefix = '<i class="docs-fa docs-warning-sign"></i> <b>Warning:</b>'
                        role = 'role="alert"'
                        key = key + '-warning'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addKeyboard(innerHTML)
                        innerHTML = ED.utilities.addItalics(innerHTML)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Error': {
                        styleClass = 'class="docs-font-small docs-alert-error"'
                        prefix = '<i class="docs-fa docs-warning-sign"></i> <b>Error:</b>'
                        role = 'role="alert"'
                        key = key + '-error'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Callout': {
                        styleClass = 'class="docs-font-small docs-callout"'
                        prefix = ''
                        role = ''
                        key = key + '-callout'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addKeyboard(innerHTML)
                        innerHTML = ED.utilities.addItalics(innerHTML)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Summary': {
                        styleClass = 'class="docs-font-small docs-summary"'
                        prefix = '<b>Summary:</b>'
                        role = ''
                        key = key + '-summary'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addKeyboard(innerHTML)
                        innerHTML = ED.utilities.addItalics(innerHTML)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Section': {
                        styleClass = 'class="docs-section"'
                        prefix = ''
                        role = ''
                        key = key + '-section'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'List': {
                        styleClass = ''
                        prefix = '<ul><li>'
                        sufix = '</li></ul>'
                        role = ''
                        key = key + '-list'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addCodeToCamelCase(innerHTML)
                        innerHTML = ED.utilities.addBold(innerHTML)
                        innerHTML = ED.utilities.addKeyboard(innerHTML)
                        innerHTML = ED.utilities.addItalics(innerHTML)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = innerHTML + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        break
                    }
                    case 'Table': {
                        styleClass = ''
                        prefix = '<table class="docs-info-table">'
                        sufix = '</table>' + ED.utilities.addWarningIfTranslationIsOutdated(paragraph, thisObject.currentLanguageCode)
                        role = ''
                        key = key + '-table'
                        innerHTML = ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode)
                        innerHTML = ED.utilities.addToolTips(innerHTML, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project)
                        innerHTML = ED.utilities.parseTable(innerHTML)
                        innerHTML = ED.utilities.addItalics(innerHTML)
                        break
                    }
                    case 'Hierarchy': {
                        styleClass = ''
                        prefix = '<table class="docs-hierarchy-table" params="' + paragraph.text + '">'
                        sufix = '</table>'
                        role = ''
                        key = key + '-hierarchy'
                        innerHTML = await parseHierarchy(paragraph.text)
                        break
                    }
                    case 'Link': {
                        styleClass = ''
                        prefix = ''
                        sufix = ''
                        role = ''
                        key = key + '-link'
                        innerHTML = ED.utilities.parseLink(ED.utilities.getTextBasedOnLanguage(paragraph, thisObject.currentLanguageCode))
                        break
                    }
                    case 'Youtube': {
                        styleClass = ''
                        prefix = ''
                        sufix = ''
                        role = ''
                        key = key + '-youtube'
                        innerHTML = ED.utilities.parseYoutube(paragraph.text)
                        break
                    }
                    case 'Gif': {
                        styleClass = ''
                        prefix = ''
                        sufix = ''
                        role = ''
                        key = key + '-gif'
                        innerHTML = ED.utilities.parseGIF(ED.utilities.normaliseInternalLink(paragraph.text.split('/')))
                        break
                    }
                    case 'Png': {
                        styleClass = ''
                        prefix = ''
                        sufix = ''
                        role = ''
                        key = key + '-png'
                        innerHTML = ED.utilities.parsePNG(ED.utilities.normaliseInternalLink(paragraph.text.split('/')))
                        break
                    }
                    case 'Javascript': {
                        styleClass = ''
                        prefix = '<pre><code class="language-javascript">'
                        sufix = '</code></pre>'
                        role = ''
                        key = key + '-javascript'
                        innerHTML = paragraph.text
                        break
                    }
                    case 'Json': {
                        styleClass = ''
                        prefix = '<pre><code class="language-json">'
                        sufix = '</code></pre>'
                        role = ''
                        key = key + '-json'
                        innerHTML = paragraph.text
                        break
                    }
                    case 'Anchor': {
                        styleClass = 'class="docs-hidden-anchor"'
                        prefix = '<div id="' + 'docs-anchor-' + paragraph.text.toLowerCase().replaceAll(' ', '-') + '">'
                        sufix = '</div>'
                        role = ''
                        key = key + '-anchor'
                        innerHTML = paragraph.text
                        break
                    }
                    case 'Block': {
                        styleClass = 'class="docs-hidden-block"'
                        prefix = ''
                        role = ''
                        key = key + '-block'
                        innerHTML = paragraph.text
                        break
                    }
                    case 'Include': {
                        styleClass = 'class="docs-hidden-include"'
                        prefix = ''
                        role = ''
                        key = key + '-include'
                        innerHTML = paragraph.text
                        break
                    }
                    case 'Placeholder': {
                        styleClass = 'class="docs-hidden-placeholder"'
                        prefix = ''
                        role = ''
                        key = key + '-placeholder'
                        innerHTML = paragraph.text
                        break
                    }
                    case 'Chapter': {
                        styleClass = 'class="docs-chapter"'
                        prefix = ''
                        role = ''
                        key = key + '-chapter'
                        innerHTML = paragraph.text
                        break
                    }
                }

                paragraphMap.set(key, paragraph)
                return '<p><div id="' + key + '" ' + styleClass + ' ' + role + '>' + prefix + ' ' + innerHTML + sufix + '</div></p>'
            }

            // function hightlightEmbeddedCode() {
            //     _self.Prism.highlightAllUnder(docsContentDiv, true)
            // }

            async function parseHierarchy(params) {

                const MAX_COLUMNS = 8
                const MAX_ROWS = 100

                const ELBOW = 'elbow'
                const FORK = 'fork'
                const LINE = 'line'
                const SPACE = 'space'

                let splittedParams = params.split('->')
                let project = splittedParams[0]
                let type = splittedParams[1]
                let levels = splittedParams[2]

                let projectSchema = SCHEMAS_BY_PROJECT.get(project)
                if(projectSchema === undefined) {
                    projectSchema = await ED.schemas.convertProjectsToSchemas(project).then(() => SCHEMAS_BY_PROJECT.get(project))
                }
                appSchemaDocument = projectSchema.map.appSchema.get(type)
                if(appSchemaDocument === undefined) {
                    return
                }
                if(isNaN(levels) === true) {
                    return
                }
                if(levels > MAX_COLUMNS) {
                    return
                }

                let contentMatrix = []

                for(let i = 0; i < MAX_ROWS; i++) {
                    contentMatrix.push(['', '', '', '', '', '', '', ''])
                }

                let currentColumn = 0
                let currentRow = -1

                scanHierarchy(appSchemaDocument, project, currentColumn)
                fillEmptySpaces()
                putTheLines()
                addImageContainers()

                let HTML = ''
                addHTML()
                return HTML

                function scanHierarchy(schemaDocument, project, currentColumn, lastChild) {

                    if(schemaDocument === undefined) {
                        return
                    }

                    currentRow++

                    let imageItem = {
                        div: 'hierarchy-image-div-' + hierarchyImagesArray.length,
                        project: project,
                        type: schemaDocument.type,
                        size: 50
                    }
                    let imageContainer = '<div id="' + imageItem.div + '" class="docs-hierarchy-image-container"/>'
                    hierarchyImagesArray.push(imageItem)

                    let matrixValue = '<table><tr><td class="docs-hierarchy-table-cell">' + imageContainer + '</td></tr><tr><td  class="docs-hierarchy-table-cell">' + ED.utilities.addToolTips(schemaDocument.type, thisObject.currentDocumentBeingRendered.type, thisObject.currentDocumentBeingRendered.project) + '</td></tr></table>'
                    let matrixRow = contentMatrix[currentRow]
                    matrixRow[currentColumn] = matrixValue

                    if(lastChild === true) {
                        matrixRow[currentColumn - 1] = ELBOW
                    }
                    if(lastChild === false) {
                        matrixRow[currentColumn - 1] = FORK
                    }

                    if(schemaDocument.childrenNodesProperties === undefined) {
                        return
                    }

                    for(let i = 0; i < schemaDocument.childrenNodesProperties.length; i++) {
                        let property = schemaDocument.childrenNodesProperties[i]
                        let childProject = project
                        if(property.project !== undefined) {
                            childProject = property.project
                        }
                        let childType = property.childType
                        let childSchemaDocument = SCHEMAS_BY_PROJECT.get(project).map.appSchema.get(childType)

                        if(i === schemaDocument.childrenNodesProperties.length - 1) {
                            lastChild = true
                        } else {
                            lastChild = false
                        }

                        if(currentColumn + 1 < levels) {
                            scanHierarchy(childSchemaDocument, childProject, currentColumn + 1, lastChild)
                        }
                    }
                }

                function fillEmptySpaces() {
                    /*
                    Fill the empty spaces
                    */
                    for(let i = 0; i < contentMatrix.length; i++) {
                        let matrixRow = contentMatrix[i]
                        for(let j = 0; j < matrixRow.length; j++) {
                            if(matrixRow[j] === '') {
                                matrixRow[j] = SPACE
                            }
                        }
                    }
                }

                function putTheLines() {
                    /*
                    Now we will scan the Matrix to put the lines of the hierarchy.
                    */
                    for(let i = 0; i < contentMatrix.length; i++) {
                        let matrixRow = contentMatrix[i]
                        let previousRow = contentMatrix[i - 1]
                        for(let j = 0; j < matrixRow.length; j++) {
                            if(previousRow && matrixRow[j] === SPACE) {
                                if(previousRow[j] === FORK || previousRow[j] === LINE) {
                                    matrixRow[j] = LINE
                                }
                            }
                        }
                    }
                }

                function addImageContainers() {
                    /*
                    Add Image Containers
                    */
                    for(let i = 0; i < contentMatrix.length; i++) {
                        let matrixRow = contentMatrix[i]
                        for(let j = 0; j < matrixRow.length; j++) {

                            let imageItem = {
                                div: 'hierarchy-image-div-' + hierarchyImagesArray.length,
                                project: 'Foundations'
                            }

                            switch(matrixRow[j]) {
                                case LINE: {
                                    imageItem.name = 'tree-connector-line'
                                    matrixRow[j] = generateMatrixRow(imageItem.div)
                                    hierarchyImagesArray.push(imageItem)
                                    break
                                }
                                case SPACE: {
                                    imageItem.name = 'tree-spacer'
                                    matrixRow[j] = generateMatrixRow(imageItem.div)
                                    hierarchyImagesArray.push(imageItem)
                                    break
                                }
                                case FORK: {
                                    imageItem.name = 'tree-connector-fork'
                                    matrixRow[j] = generateMatrixRow(imageItem.div)
                                    hierarchyImagesArray.push(imageItem)
                                    break
                                }
                                case ELBOW: {
                                    imageItem.name = 'tree-connector-elbow'
                                    matrixRow[j] = generateMatrixRow(imageItem.div)
                                    hierarchyImagesArray.push(imageItem)
                                    break
                                }
                            }

                        }
                    }

                    function generateMatrixRow(imageItemDiv) {
                        return '<div id="' + imageItemDiv + '" class="docs-hierarchy-image-container"/>'
                    }
                }

                function addHTML() {
                    /*
                    Add HTML
                    */
                    let oddRow = false
                    for(let i = 0; i < currentRow + 1; i++) {
                        let matrixRow = contentMatrix[i]

                        let rowClass
                        if(oddRow === false) {
                            oddRow = true
                            rowClass = ''
                        } else {
                            oddRow = false
                            rowClass = 'class="docs-hierarchy-table-row"'
                        }

                        HTML = HTML + '<tr ' + rowClass + '>'
                        for(let j = 0; j < matrixRow.length; j++) {
                            HTML = HTML + '<td class="docs-hierarchy-table-cell"><center>'
                            HTML = HTML + matrixRow[j]
                            HTML = HTML + '</center></td>'
                        }
                        HTML = HTML + '</tr>'
                    }
                }
            }

            /**
             * 
             * @param {{
             *   topic: string?, 
             *   tutorial:string?
             * }?} previousPage
             * @param {{
             *   topic: string?, 
             *   tutorial:string?
             * }?} nextPage
             * @param {string} category
             * @returns 
             */
            function generateNavigationLinks(previousPage, nextPage, category) {
                HTML = HTML + '<div class="docs-topic-navigation"><div>'
                if(previousPage !== undefined) {
                    HTML = HTML + previousPaginationLinkBuilder(category, previousPage.type)
                }
                HTML = HTML + '</div><div>'
                if(nextPage !== undefined) {
                    HTML = HTML + nextPaginationLinkBuilder(category, nextPage.type)
                }
                HTML = HTML + '</div></div>'
            }
        }

        /**
         * 
         * @param {string} category
         * @param {string} pageType
         * @returns {string}
         */
        function previousPaginationLinkBuilder(category, pageType) {
            return paginationLinkBuilder(category, pageType, 'Previous')
        }

        /**
         * 
         * @param {string} category
         * @param {string} pageType
         * @returns {string}
         */
        function nextPaginationLinkBuilder(category, pageType) {
            return paginationLinkBuilder(category, pageType, 'Next')
        }

        /**
         * 
         * @param {string} category
         * @param {string} pageType
         * @param {string} content
         * @returns {string}
         */
        function paginationLinkBuilder(category, pageType, content) {
            return `${generateUnstyledLink(category, pageType, content)}<br/> ${pageType}`
        }

        /**
         * 
         * @param {string} category
         * @param {string} pageType
         * @param {string} content
         * @returns {string} 
         */
        function generateUnstyledLink(category, pageType, content) {
            const link = ED.utilities.normaliseInternalLink([/*thisObject.currentLanguageCode, */ thisObject.currentDocumentBeingRendered.project, category, ED.utilities.normaliseStringForLink(pageType)])
            return '<a href="' + link + '"> ' + content + ' </a>'
        }
    }

    function addFooter() {

        let HTML = ''

        HTML = HTML + '<div id="docs-footer" class="docs-node-html-footer-container">' // Container Starts

        // Buttons Section

        HTML = HTML + '<div class="docs-node-html-footer-table">'
        HTML = HTML + '<div class="docs-footer-row">'

        HTML = HTML + '<div class="docs-footer-cell" style="white-space: nowrap; overflow-x: auto;" >' // white-space: nowrap; overflow-x: auto; prevents line breaks when combined with display: inline-block;" in the child elements

        if(thisObject.currentDocumentBeingRendered !== undefined) {
            HTML = HTML + '<span style="float: right; display: inline-block;" onClick="sharePage()"><button>SHARE</button></span>'
        }
        HTML = HTML + '<span style="float: right; display: inline-block;" onClick="scrollToElement(\'docs-space-div\')"><button>TO TOP</button></span>'
        if(previousDocumentBeingRendered !== undefined) {
            HTML = HTML + generateFooterBookLink(previousDocumentBeingRendered.project, previousDocumentBeingRendered.category, previousDocumentBeingRendered.type, 'BACK')
        }
        if(thisObject.currentBookBeingRendered !== undefined) {
            HTML = HTML + generateFooterBookLink(thisObject.currentBookBeingRendered.project, thisObject.currentBookBeingRendered.category, thisObject.currentBookBeingRendered.type, 'TO BOOK')
        }

        HTML = HTML + generateFooterBookLink('Foundations', 'Book', 'Reviews', 'REVIEWS')
        HTML = HTML + generateFooterBookLink('Foundations', 'Book', 'Community Data Mines', 'DATA MINES')
        HTML = HTML + generateFooterBookLink('Foundations', 'Book', 'First Steps Tutorials', 'TUTORIALS')
        HTML = HTML + generateFooterBookLink('Foundations', 'Book', 'User Manual', 'USER MANUAL')

        HTML = HTML + '</div>'

        HTML = HTML + '</div>'
        HTML = HTML + '</div>'

        // Language Section

        HTML = HTML + '<div class="docs-node-html-footer-table">'
        HTML = HTML + '<div class="docs-footer-row">'

        HTML = HTML + '<div class="docs-footer-cell" style="white-space: nowrap; overflow-x: auto; ">'
        HTML = HTML + '<h3 style="display: inline-block;">Help Superalgos Speak Your Language!</h3>'
        HTML = HTML + '</div>'

        HTML = HTML + '</div>'
        HTML = HTML + '</div>'

        HTML = HTML + '<div class="docs-node-html-footer-table">'
        HTML = HTML + '<div class="docs-footer-row">'

        HTML = HTML + '<div class="docs-footer-cell">'
        HTML = HTML + '<h4>Multi-language Docs</h4>'
        HTML = HTML + 'We produce the original Docs in English and you get the content in your preferred language only when translations are available. When not, you get the default content, in English.'
        HTML = HTML + '</div>'

        HTML = HTML + '<div class="docs-footer-cell">'
        HTML = HTML + '<h4>Choose Your Language</h4>'
        HTML = HTML + 'Click on your preferred language:<br/>'

        /**
         * Iterate over the available languages and add links for each
         */
        for(let key in languagePack) {
            HTML = HTML + generateLanguageLink(key, languagePack[key])
        }

        HTML = HTML + '</div>'

        HTML = HTML + '<div class="docs-footer-cell">'
        HTML = HTML + '<h4>Contribute Translations</h4>'
        HTML = HTML + 'Earn tokens by helping translate the Docs and tutorials to your native language! Search the Docs for How to Contribute Translations and join the Superalgos Docs Group to coordinate with other contributors...'
        HTML = HTML + '</div>'

        HTML = HTML + '</div>'
        HTML = HTML + '</div>'

        // GitHub Section

        HTML = HTML + '<div class="docs-node-html-footer-table">'
        HTML = HTML + '<div class="docs-footer-row">'

        HTML = HTML + '<div class="docs-footer-cell" style="white-space: nowrap; overflow-x: auto; ">'
        HTML = HTML + '<h3 style="display: inline-block;">Manage Your Superalgos Setup and Contributions!</h3>'
        HTML = HTML + '</div>'

        HTML = HTML + '</div>'
        HTML = HTML + '</div>'

        HTML = HTML + '<div class="docs-node-html-footer-table">'

        HTML = HTML + '<div class="docs-footer-row">'

        HTML = HTML + '</div>'
        HTML = HTML + '</div>'

        // Community Section

        HTML = HTML + '<div class="docs-node-html-footer-table">'
        HTML = HTML + '<div class="docs-footer-row">'
        HTML = HTML + '<div class="docs-footer-cell" style="white-space: nowrap; overflow-x: auto; ">'
        HTML = HTML + '<h3 style="display: inline-block;">Meet the Community and the Team!</h3>'
        HTML = HTML + '</div>'
        HTML = HTML + '</div>'
        HTML = HTML + '</div>'

        HTML = HTML + '<div class="docs-node-html-footer-table">'

        HTML = HTML + '<div class="docs-footer-row">'
        HTML = HTML + '<div class="docs-footer-cell">'
        HTML = HTML + '<h4>Join the Conversation</h4>'
        HTML = HTML + '<p>We have a new <a href="https://discord.gg/CGeKC6WQQb" target="_blank">Discord Server</a> with multiple channels and a new <a href="https://forum.superalgos.org/" target="_blank">Community Forum</a>.</p>'
        HTML = HTML + '<p>The community is a lot more active in the original Telegram groups listed on the right.</p>'
        HTML = HTML + '</div>'

        HTML = HTML + '<div class="docs-footer-cell">'
        HTML = HTML + '<h4>Telegram Groups</h4>'
        HTML = HTML + '<ul>'
        HTML = HTML + '<li><a href="https://t.me/superalgoscommunity" target="_blank">Community</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgossupport" target="_blank">Technical Support</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgosdevelop" target="_blank">Developers</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgosdatamining" target="_blank">Data Mining</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgosmachinelearning" target="_blank">Machine Learning</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgosdocs" target="_blank">Docs/Education</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgosuxui" target="_blank">UX/UI Design</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgosmarketing" target="_blank">Marketing</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgostoken" target="_blank">Token</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgostrading" target="_blank">Trading</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgoscollaborations" target="_blank">Collaborations</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgoscodebase" target="_blank">Codebase Learning</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgosnontechusers" target="_blank">Non-Tech Users</a></li>'
        HTML = HTML + '</ul>'
        HTML = HTML + '</div>'

        HTML = HTML + '<div class="docs-footer-cell">'
        HTML = HTML + '<h4>Non-English Telegram Groups</h4>'
        HTML = HTML + '<ul>'
        HTML = HTML + '<li><a href="https://t.me/superalgos_es" target="_blank">Spanish</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgos_ru" target="_blank">Russian</a></li>'
        HTML = HTML + '<li><a href="https://t.me/tr_superalgos" target="_blank">Turkish</a></li>'
        HTML = HTML + '<li><a href="https://t.me/superalgos_de" target="_blank">German</a></li>'
        HTML = HTML + '</ul>'
        HTML = HTML + '<h4>Other Resources</h4>'
        HTML = HTML + '<ul>'
        HTML = HTML + '<li><a href="https://t.me/superalgos" target="_blank">Official Announcements</a></li>'
        HTML = HTML + '<li><a href="https://superalgos.org" target="_blank">Features and Functionality</a></li>'
        HTML = HTML + '<li><a href="https://github.com/Superalgos/Superalgos" target="_blank">Main Github Repository</a></li>'
        HTML = HTML + '<li><a href="https://www.youtube.com/c/superalgos" target="_blank">Subscribe in YouTube</a></li>'
        HTML = HTML + '<li><a href="https://twitter.com/superalgos" target="_blank">Follow us on Twitter</a></li>'
        HTML = HTML + '<li><a href="https://www.facebook.com/superalgos" target="_blank">Connect on Facebook</a></li>'
        HTML = HTML + '<li><a href="https://medium.com/Superalgos/" target="_blank">Read the Blog</a></li>'
        HTML = HTML + '</ul>'
        HTML = HTML + '</div>'
        HTML = HTML + '</div>'

        HTML = HTML + '<div class="docs-footer-row">'
        HTML = HTML + '<div class="docs-footer-cell">'
        HTML = HTML + '<img src="' + ED.utilities.normaliseInternalLink(['Images','superalgos-logo-white.png']) + '" width="200 px">'
        HTML = HTML + '</div>'
        HTML = HTML + '</div>'
        HTML = HTML + '</div>'

        HTML = HTML + '</div>' // Container Ends

        return HTML

        function generateFooterBookLink(project, category, pageType, content) {
            const link = ED.utilities.normaliseInternalLink([/*thisObject.currentLanguageCode,*/ project, category, ED.utilities.normaliseStringForLink(pageType)])
            return '<a style="float: right; display: inline-block;" href="' + link + '">' + content + ' </a>'
        }

        /**
         * 
         * @param {string} key
         * @param {string} language
         */
        function generateLanguageLink(key, language) {
            let link = ED.utilities.normaliseInternalLink(['index.html']) //key.toLowerCase() + '/index.html') // TODO: add language support
            if(thisObject.currentDocumentBeingRendered !== undefined) {
                link = ED.utilities.normaliseInternalLink([/*key.toLowerCase(),*/ thisObject.currentDocumentBeingRendered.project, thisObject.currentDocumentBeingRendered.category, ED.utilities.normaliseStringForLink(thisObject.currentDocumentBeingRendered.type) + '.html'])
            }
            let HTML = '<a href="' + link + '"><img src="' + ED.utilities.normaliseInternalLink(['Images','Languages', key + '.png']) + '" title="' + language + '" class="docs-footer-language'
            if(thisObject.currentLanguageCode === key) {
                HTML = HTML + '-selected'
            }
            return HTML + '"></a>'
        }
    }
}
