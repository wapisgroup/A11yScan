"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

interface MermaidProps {
  chart: string;
}

let mermaidInitialized = false;

export function Mermaid({ chart }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: true,
        theme: "base",
        themeVariables: {
          primaryColor: "#e0e7ff",
          primaryTextColor: "#000000",
          primaryBorderColor: "#1e40af",
          lineColor: "#1e40af",
          secondaryColor: "#f1f5f9",
          tertiaryColor: "#fef3c7",
          background: "#ffffff",
          mainBkg: "#e0e7ff",
          secondBkg: "#f1f5f9",
          tertiaryBkg: "#fef3c7",
          textColor: "#000000",
          border1: "#1e40af",
          border2: "#3b82f6",
          arrowheadColor: "#1e40af",
          fontFamily: "inherit",
          fontSize: "14px",
          labelTextColor: "#000000",
          edgeLabelBackground: "#ffffff",
          actorBorder: "#1e40af",
          actorBkg: "#e0e7ff",
          actorTextColor: "#000000",
          actorLineColor: "#1e40af",
          signalColor: "#1e40af",
          signalTextColor: "#000000",
          labelBoxBkgColor: "#ffffff",
          labelBoxBorderColor: "#1e40af",
          loopTextColor: "#000000",
          noteBorderColor: "#d97706",
          noteBkgColor: "#fef3c7",
          noteTextColor: "#000000",
          activationBorderColor: "#1e40af",
          activationBkgColor: "#dbeafe",
          sequenceNumberColor: "#ffffff",
        },
        securityLevel: "loose",
        flowchart: {
          htmlLabels: true,
          curve: "basis",
        },
        sequence: {
          actorMargin: 50,
          width: 150,
          height: 65,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35,
          mirrorActors: true,
          useMaxWidth: true,
        },
      });
      mermaidInitialized = true;
    }

    const renderDiagram = async () => {
      if (ref.current && chart) {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
            // Force all elements to be visible
            const svgElement = ref.current.querySelector("svg");
            if (svgElement) {
              svgElement.style.backgroundColor = "#ffffff";
              
              // Make all text dark and visible
              const textElements = svgElement.querySelectorAll("text, .edgeLabel text, .label, .messageText, .actor");
              textElements.forEach((el) => {
                (el as HTMLElement).style.fill = "#000000";
                (el as HTMLElement).style.color = "#000000";
              });
              
              // Make all lines and paths visible with strong color
              const lineElements = svgElement.querySelectorAll("path.messageLine0, path.messageLine1, line");
              lineElements.forEach((el) => {
                (el as HTMLElement).style.stroke = "#1e40af";
                (el as HTMLElement).style.strokeWidth = "2";
              });
              
              // Make arrows visible
              const markerElements = svgElement.querySelectorAll("marker path, .arrowheadPath");
              markerElements.forEach((el) => {
                (el as HTMLElement).style.fill = "#1e40af";
                (el as HTMLElement).style.stroke = "#1e40af";
              });
              
              // Fix actor boxes - light blue background with dark border
              const actorBoxes = svgElement.querySelectorAll("rect.actor");
              actorBoxes.forEach((el) => {
                (el as HTMLElement).style.fill = "#e0e7ff";
                (el as HTMLElement).style.stroke = "#1e40af";
                (el as HTMLElement).style.strokeWidth = "2";
              });
              
              // Fix note boxes - yellow background
              const noteBoxes = svgElement.querySelectorAll("rect.note");
              noteBoxes.forEach((el) => {
                (el as HTMLElement).style.fill = "#fef3c7";
                (el as HTMLElement).style.stroke = "#d97706";
                (el as HTMLElement).style.strokeWidth = "2";
              });
              
              // Make edge labels have white backgrounds
              const edgeLabels = svgElement.querySelectorAll(".edgeLabel");
              edgeLabels.forEach((el) => {
                (el as HTMLElement).style.backgroundColor = "#ffffff";
              });
            }
          }
        } catch (error) {
          console.error("Mermaid rendering error:", error);
          if (ref.current) {
            ref.current.innerHTML = `<pre class="text-red-600 bg-red-50 p-4 rounded">Error rendering diagram: ${
              error instanceof Error ? error.message : "Unknown error"
            }</pre>`;
          }
        }
      }
    };

    renderDiagram();
  }, [chart]);

  return <div ref={ref} className="my-6 flex justify-center bg-white p-4 rounded-lg" />;
}
