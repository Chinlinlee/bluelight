export const aiServiceConfig = {
    baseUrl: "https://dicom.ai.example.com",
    services: [
        {
            name: "ai",
            apiUrl: "/ai-service/ai",
            selector: [
                {
                    level: "instance",
                    name: "ai",
                    push: true
                }
            ]
        },
        {
            name: "ai-with-two-series",
            apiUrl: "/ai-service/ai-with-two-series",
            selector: [
                {
                    level: "series",
                    name: "series 1",
                    push: true
                },
                {
                    level: "series",
                    name: "series 1",
                    push: true
                }
            ],
            init: () => {},
            /**
             * 
             * @param {*} data The data of ai service response
             */
            postFunction: (data) => {
                
            },
            /**
             * 
             * @param {*} aiServiceOption The current ai service option
             * @param {*} url {baseUrl}/aiServiceOption.apiUrl
             * @param {*} requestBody 
             */
            customCall: async (aiServiceOption, url, requestBody) => {
                
            }
        }
    ]
};
