import { NextResponse } from "next/server";
import { getAveragePrice, getEmailNotifType, getHighestPrice, getLowestPrice } from "@/lib/utils";
import { connectToDb } from "@/lib/mongoose";
import Product from "@/lib/models/product.model";
import { scrapeAmazonProduct } from "@/lib/scraper";
import { generateEmailBody, sendEmail } from "@/lib/nodemailer";

export const maxDuration = 10; // 
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET (request: Request) {
    try {
        connectToDb();

        const products = await Product.find({});

        if(!products) throw new Error("No Products Found");

        //1.) scrape latest product details and update db
        const updatedProducts = await Promise.all(products.map(async (currentProduct) => {
            //scrape product detailsq
            const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);

            if(!scrapedProduct) return;

            const updatedPriceHistory = [
                ...currentProduct.priceHistory,
                {
                  price: scrapedProduct.currentPrice,
                },
              ];

            const product = {
                ...scrapedProduct,
                priceHistory: updatedPriceHistory,
                lowestPrice: getLowestPrice(updatedPriceHistory),
                highestPrice: getHighestPrice(updatedPriceHistory),
                averagePrice: getAveragePrice(updatedPriceHistory),
            };

            //update product in db
            const updatedProduct = await Product.findOneAndUpdate(
                { url: product.url },
                product,
            );

            //2.) check each product's status and send email if necessary
            const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);

            if(emailNotifType && updatedProduct.users.length > 0) {
                const productInfo = {
                    title: updatedProduct.title,
                    url: updatedProduct.url,
                };

                //generate email body
                const emailContent = await generateEmailBody(productInfo, emailNotifType);
                //get array of user emails
                const userEmails = updatedProduct.users.map((user:any) => user.email);
                //send email notification
                await sendEmail(emailContent, userEmails);
                }

                return updatedProduct;
            }));
            return NextResponse.json({ message: 'OK', data: updatedProducts })    
    } catch (error:any) {
        throw new Error(`Failed to get all products. Error in GET:${error.message}`)
    }
};