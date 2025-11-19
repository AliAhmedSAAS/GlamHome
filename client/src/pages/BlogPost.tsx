import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, ArrowLeft } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import SEOHead from "@/components/SEOHead";
import { useEffect } from "react";

export default function BlogPostPage() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${slug}`],
    enabled: !!slug,
  });

  useEffect(() => {
    if (post) {
      const schema = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "author": {
          "@type": "Organization",
          "name": post.author || "Kosmospace Team"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Kosmospace",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.kosmospace.com/logo.png"
          }
        },
        "datePublished": post.createdAt,
        "dateModified": post.updatedAt,
        "image": post.coverImage ? `https://www.kosmospace.com${post.coverImage}` : undefined,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://www.kosmospace.com/blog/${post.slug}`
        }
      };

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      script.id = 'blog-post-schema';
      document.head.appendChild(script);

      return () => {
        const schemaElement = document.getElementById('blog-post-schema');
        if (schemaElement) {
          schemaElement.remove();
        }
      };
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 bg-muted animate-pulse rounded mb-6 w-1/3" />
            <div className="h-12 bg-muted animate-pulse rounded mb-4" />
            <div className="h-6 bg-muted animate-pulse rounded mb-8 w-1/2" />
            <div className="space-y-4">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-serif font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist.</p>
            <Link href="/blog">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEOHead 
        title={`${post.title} | Kosmospace Blog`}
        description={post.excerpt}
        keywords={post.tags?.join(', ') || ''}
      />
      <Header />
      
      <main className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog">
            <Button variant="ghost" className="mb-8" data-testid="button-back-to-blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          <article>
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="secondary" className="capitalize">
                  {post.category}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime} min read</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.createdAt.toString()}>
                    {new Date(post.createdAt).toLocaleDateString('en-AE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4" data-testid="blog-post-title">
                {post.title}
              </h1>

              <p className="text-xl text-muted-foreground">
                {post.excerpt}
              </p>

              {post.coverImage && (
                <div className="mt-8 rounded-lg overflow-hidden">
                  <img 
                    src={post.coverImage} 
                    alt={post.title}
                    className="w-full h-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </header>

            <div 
              className="prose prose-lg max-w-none
                prose-headings:font-serif prose-headings:font-bold
                prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-a:text-primary hover:prose-a:underline
                prose-strong:text-foreground
                prose-ul:text-muted-foreground prose-ol:text-muted-foreground
                prose-li:my-1
                dark:prose-invert"
              data-testid="blog-post-content"
              dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
            />

            {post.tags && post.tags.length > 0 && (
              <footer className="mt-12 pt-8 border-t">
                <h3 className="text-sm font-semibold mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </footer>
            )}
          </article>

          <div className="mt-12 pt-8 border-t text-center">
            <h3 className="text-2xl font-serif font-bold mb-4">
              Ready to Experience Luxury Beauty?
            </h3>
            <p className="text-muted-foreground mb-6">
              Book professional beauty services delivered to your home in Dubai
            </p>
            <Link href="/find-beauticians">
              <Button size="lg" data-testid="button-book-now">
                Browse Beauticians
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
