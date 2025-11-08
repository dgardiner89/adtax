"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Meta Ad File Name Generator</CardTitle>
            <CardDescription>
              A tool for standardising how advertising creative files are named and organised across campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="example">Example</TabsTrigger>
              </TabsList>
              <TabsContent value="about" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Overview</h2>
                    <p className="text-muted-foreground mb-4">
                      This tool generates structured file names for ad creative assets used in Meta ads, YouTube ads, Google Display, TikTok and other advertising platforms. It is intended for teams who want a consistent way to label creative exports so they can be searched, referenced, compared and reported on without manual guesswork.
                    </p>
                    <p className="text-muted-foreground">
                      Naming conventions are often treated as a minor detail, but they shape how quickly teams can work and how easily they can understand what has already been created. When naming is inconsistent, libraries become difficult to navigate, duplicate work increases and creative testing data becomes harder to interpret. A clear naming structure removes that friction.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      This tool provides a simple system for defining variables, selecting values and generating file names that follow a shared format.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-3">How It Works</h2>
                    <p className="text-muted-foreground mb-4">
                      You configure a set of variables that matter to your workflow. Common variables include:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Format (for example: 16x9, 9x16, 1x1)</li>
                      <li>Funnel stage (for example: cold, warm, retargeting)</li>
                      <li>Persona or audience segment</li>
                      <li>Creative archetype or concept</li>
                      <li>Campaign objective or offer</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      You can define each variable as a dropdown list, a multi-select field or a free text input. You can also specify the separator character and whether names should be uppercase, lowercase or unchanged.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      Once configured, you select values in the Generator view and the tool outputs a file name that matches the structure you defined. This means you do not need to remember naming rules or check other files to stay consistent.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-3">Why This Exists</h2>
                    <p className="text-muted-foreground mb-4">
                      Most advertising teams store thousands of creative files across shared drives, project folders and version histories. Without a consistent naming convention, it becomes difficult to:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Identify which creative belongs to which campaign</li>
                      <li>Understand the purpose or testing intent behind a variation</li>
                      <li>Locate past assets for reuse or comparison</li>
                      <li>Track the performance of specific creative types over time</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      A structured naming system turns the asset library into something you can query and reason about. It allows for cleaner reporting and more reliable testing because creative variations become easier to compare.
                    </p>
                    <p className="text-muted-foreground mt-4">
                      This tool exists to reduce ambiguity and to make organisation an intentional part of the creative process rather than something fixed after the fact.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-3">Features</h2>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Customisable variable definitions</li>
                      <li>Dropdown, multi-select and free-text field types</li>
                      <li>Custom separator characters</li>
                      <li>Case formatting options</li>
                      <li>Descriptions for variable meaning and usage</li>
                      <li>Optional configuration lock for shared standards</li>
                      <li>File name history for reference and reuse</li>
                    </ul>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-3">Intended Use</h2>
                    <p className="text-muted-foreground">
                      This tool is for internal workflow organisation. It is not designed as a commercial consumer product. It is meant for teams who are already producing and testing creative regularly and want to maintain clarity as volume increases.
                    </p>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-3">Suggested Practice</h2>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Agree on naming conventions early.</li>
                      <li>Document the meaning of each variable.</li>
                      <li>Stick to the structure even when deadlines are tight.</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      Future you (and your team) will be able to find things faster and understand past decisions more accurately.
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="example" className="space-y-6 mt-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Example Naming Structure</h2>
                    <div className="bg-muted p-4 rounded-md font-mono text-sm mb-4">
                      16x9_creator_cold_demo_curiosity_free_trial_v1
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-3">Breakdown of Components</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-semibold">Component</th>
                            <th className="text-left p-2 font-semibold">Example</th>
                            <th className="text-left p-2 font-semibold">Meaning</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Size</td>
                            <td className="p-2 font-mono text-sm">16x9</td>
                            <td className="p-2 text-muted-foreground">The aspect ratio or placement format. Helps identify where the creative is intended to run (for example feed vs stories vs reels).</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Persona</td>
                            <td className="p-2 font-mono text-sm">creator</td>
                            <td className="p-2 text-muted-foreground">The audience or segment the creative is written for. Useful when teams run variations of the same idea for different audiences.</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Funnel Stage</td>
                            <td className="p-2 font-mono text-sm">cold</td>
                            <td className="p-2 text-muted-foreground">Indicates where the ad sits in the customer journey. Helps when reviewing testing performance and avoiding mismatched messaging.</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Archetype</td>
                            <td className="p-2 font-mono text-sm">demo</td>
                            <td className="p-2 text-muted-foreground">The conceptual structure of the creative (for example demo, story, proof, claim). Used for pattern recognition when analysing what type of creative works.</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Hook</td>
                            <td className="p-2 font-mono text-sm">curiosity</td>
                            <td className="p-2 text-muted-foreground">The primary psychological angle of the headline or intro. Allows classification of creative intent.</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">CTA / Offer</td>
                            <td className="p-2 font-mono text-sm">free_trial</td>
                            <td className="p-2 text-muted-foreground">The action or value presented. Useful when comparing performance across offer tests.</td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2 font-medium">Variation</td>
                            <td className="p-2 font-mono text-sm">v1</td>
                            <td className="p-2 text-muted-foreground">A simple incrementing version so you can create multiple iterations without renaming the whole structure.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="border-t pt-6">
                      <h2 className="text-xl font-semibold mb-3">Another Multi-Format Example</h2>
                      <div className="bg-muted p-4 rounded-md font-mono text-sm mb-4">
                        1x1,4x5,9x16_creator_hot_feature_proof_kinso_story_test_demo_light_v3
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2 font-semibold">Component</th>
                              <th className="text-left p-2 font-semibold">Example</th>
                              <th className="text-left p-2 font-semibold">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-2 font-medium">Size</td>
                              <td className="p-2 font-mono text-sm">1x1,4x5,9x16</td>
                              <td className="p-2 text-muted-foreground">Multiple aspect ratios exported together as a batch. This helps track a concept across placements.</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 font-medium">Persona</td>
                              <td className="p-2 font-mono text-sm">creator</td>
                              <td className="p-2 text-muted-foreground">Same meaning as above.</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 font-medium">Funnel Stage</td>
                              <td className="p-2 font-mono text-sm">hot</td>
                              <td className="p-2 text-muted-foreground">Retargeting or engaged audiences.</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 font-medium">Creative Pattern</td>
                              <td className="p-2 font-mono text-sm">feature_proof</td>
                              <td className="p-2 text-muted-foreground">A combination archetype that pairs product features with a credibility element.</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 font-medium">Hook or Theme</td>
                              <td className="p-2 font-mono text-sm">kinso_story_test_demo</td>
                              <td className="p-2 text-muted-foreground">Internal shorthand. Teams often develop named internal hooks or references to previous tests.</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 font-medium">Tone / Style</td>
                              <td className="p-2 font-mono text-sm">light</td>
                              <td className="p-2 text-muted-foreground">Optional. Can represent editing style, pace, visual tone or production approach.</td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2 font-medium">Version</td>
                              <td className="p-2 font-mono text-sm">v3</td>
                              <td className="p-2 text-muted-foreground">Indicates iteration history.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <div className="border-t pt-6">
                      <h2 className="text-xl font-semibold mb-3">The Point of the Naming Structure</h2>
                      <p className="text-muted-foreground mb-4">
                        The purpose of storing this metadata in the file name is to make browsing, filtering and comparing creative faster and repeatable. The name itself acts as the first level of classification, which removes the need to rely on memory or platform-specific naming.
                      </p>
                      <p className="text-muted-foreground mb-4">
                        It becomes much easier to:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mb-4">
                        <li>Sort and filter creative exports in a folder</li>
                        <li>Compare performance across archetypes or hooks</li>
                        <li>Revisit past experiments when planning future tests</li>
                        <li>Onboard new team members into the creative system</li>
                      </ul>
                      <p className="text-muted-foreground">
                        The naming structure is not about increasing complexity. It is about storing useful context at the point of creation so it does not need to be reconstructed later.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

