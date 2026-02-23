"use client";

import { Input } from "@/shared/ui";
import { TemplatePreviewCard } from "@/features/templates";
import { RecentDocuments } from "@/features/documents";
import { useTemplateSearch } from "@/features/templates/hooks/useTemplateSearch";
import { useAuth } from "@/contexts/AuthContext";
import { Search } from "lucide-react";
import styles from "./home.module.css";

export default function HomePage() {
  const { query, setQuery, templates, hasResults } =
    useTemplateSearch();
  const { user } = useAuth();

  return (
    <div className={styles.homeBg}>
      <main className={styles.mainContent}>
        <div className={styles.leftCol}>
          <div className={styles.hero}>
            <h1 className={styles.heading}>
              {user ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Create beautiful documents in seconds'}
            </h1>
            <p className={styles.subHeading}>
              Choose a template or start from scratch. Your AI-powered workspace awaits.
            </p>
          </div>


          {/* Search Bar */}
          <div className={styles.searchBarWrap}>
            <div className={styles.searchBar}>
              <Input
                placeholder="Search a template"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.input}
              />
              <span className={styles.searchIcon}>
                <Search size={20} />
              </span>
            </div>
          </div>

          <div className={styles.primaryCtaWrap}>
            <button className={styles.primaryCta}>
              + Create Blank Document
            </button>
          </div>

          <div className={styles.quickChips}>
            <button>Proposal</button>
            <button>Report</button>
            <button>Meeting Notes</button>
            <button>Invoice</button>
          </div>



          {/* Template Cards Grid */}
          <div className={styles.grid}>
            {hasResults ? (
              templates.map((template) => (
                <TemplatePreviewCard
                  key={template.id}
                  template={template}
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                No templates found.
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents Sidebar */}
        <aside className={styles.sidebar}>
          <RecentDocuments />
        </aside>
      </main>
    </div>
  );
}
