import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function NotFound() {
    return (
        <main className="not-found-page">
            <Link href="/" aria-label="ShopYethu overview">
                <BrandLogo />
            </Link>
            <h1>This page isn’t here.</h1>
            <p>
                The address may have changed. Your workspace is still available.
            </p>
            <Link className="button button--secondary" href="/">
                Return to overview
            </Link>
        </main>
    );
}
