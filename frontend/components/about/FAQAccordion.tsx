import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQAccordionProps = {
  items: FAQItem[];
};

export const FAQAccordion = ({ items }: FAQAccordionProps) => (
  <section className="max-w-3xl mx-auto py-8 px-8 mb-12">
    <h2 className="text-3xl font-bold mb-6 text-start">FAQs</h2>
    <Accordion type="single" collapsible>
      {items.map((item, idx) => (
        <AccordionItem value={`item-${idx + 1}`} key={idx}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);
