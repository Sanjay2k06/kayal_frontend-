import { motion } from "framer-motion";

const Footer = () => (
  <footer className="border-t bg-card/40 py-14">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center justify-between gap-6 md:flex-row"
      >
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <span className="font-display text-xs font-bold text-primary-foreground">C</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">CiviX</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            AI-powered civic assistance for every citizen.
          </p>
        </div>
        <div className="h-px w-full bg-border md:hidden" />
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CiviX. All rights reserved.
        </p>
      </motion.div>
    </div>
  </footer>
);

export default Footer;
