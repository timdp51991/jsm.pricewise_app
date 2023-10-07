"use client";

import { scrapeAndStoreProduct } from "@/lib/actions";
import { FormEvent, useState } from "react";

const isValidAmazonUrl = (url: string) => {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname;

        // Check if hostname is amazon.com or amazon.co.uk, etc.
        if( hostname.includes('amazon') ||
            hostname.includes('amazon.com') ||
            hostname.includes('amazon.co.uk')
            ) {
            return true;
        }
    } catch (error) {
        return false;
    }

    return false;
};

const Searchbar = () => {
    const [searchPrompt, setSearchPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const isLinkValid = isValidAmazonUrl(searchPrompt);

        if(!isLinkValid) {
            return alert('Please Provide a valid Amazon link!');
        }
        try {
            setIsLoading(true);

            //Scrape our first product page
            const product = await scrapeAndStoreProduct(searchPrompt);
        } catch (error) {
            console.log(error);
        }finally {
            setIsLoading(false);
        }
    };


  return (
    <form 
        className="flex flex-wrap gap-4 mt-12"
        onSubmit={handleSubmit}
    >
        <input
            type="text"
            value={searchPrompt}
            onChange={(e)=> setSearchPrompt(e.target.value)}
            placeholder="Enter product link"
            className="searchbar-input"
        />

        <button 
            type="submit" 
            className="searchbar-btn"
            disabled={searchPrompt === ""}
            >
            {isLoading ? 'Searching...' : 'Search'}
        </button>

    </form>
  )
}

export default Searchbar;