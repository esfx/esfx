using System;
using System.Text.RegularExpressions;
using System.Collections.Immutable;
using System.Collections.Generic;
using System.Composition;
using System.Linq;
using Microsoft.DocAsCode.Common;
using Microsoft.DocAsCode.Build.Common;
using Microsoft.DocAsCode.DataContracts.Common;
using Microsoft.DocAsCode.DataContracts.ManagedReference;
using Microsoft.DocAsCode.Plugins;
using Microsoft.DocAsCode.Dfm;
using Microsoft.DocAsCode.MarkdownLite;

namespace LinkRewriter
{
    [Export(nameof(LinkProcessor), typeof(IDocumentBuildStep))]
    public class LinkProcessor : BaseDocumentBuildStep
    {
        public override string Name => nameof(LinkProcessor);

        public override int BuildOrder => 1;

        public override void Build(FileModel model, IHostService host)
        {
            base.Build(model, host);
        }

        public override IEnumerable<FileModel> Prebuild(ImmutableList<FileModel> models, IHostService host)
        {
            Console.WriteLine("LinkProcessor.Prebuild");
            List<FileModel> updatedFileModels = null;
            for (var i = 0; i < models.Count; i++)
            {
                var model = models[i];
                var visitedModel = model;
                var viewModel = model.Content as PageViewModel;
                if (viewModel != null)
                {
                    if (model.File.Contains("README"))
                    {
                        Console.Write(model.File);
                    }
                    var visitedViewModel = viewModel;
                    List<ItemViewModel> items = null;
                    for (var j = 0; j < viewModel.Items.Count; j++)
                    {
                        var item = viewModel.Items[j];
                        var visitedItem = item;
                        var conceptual = item.Conceptual;
                        if (!string.IsNullOrEmpty(conceptual))
                        {
                            conceptual = Regex.Replace(conceptual, @"\((?:\.\.|packages)/(?<Package>[^\\/#]+)#readme\)", match => $"xref:{match.Groups["Package"].Value}");
                        }
                        var summary = item.Summary;
                        if (!string.IsNullOrEmpty(summary))
                        {
                            summary = Regex.Replace(summary, @"\((?:\.\.|packages)/(?<Package>[^\\/#]+)#readme\)", match => $"xref:{match.Groups["Package"].Value}");
                        }
                        var remarks = item.Remarks;
                        if (!string.IsNullOrEmpty(remarks))
                        {
                            remarks = Regex.Replace(remarks, @"\((?:\.\.|packages)/(?<Package>[^\\/#]+)#readme\)", match => $"xref:{match.Groups["Package"].Value}");
                        }
                        if (conceptual != item.Conceptual ||
                            summary != item.Summary ||
                            remarks != item.Remarks)
                        {
                            visitedItem = new ItemViewModel
                            {
                                AdditionalNotes = item.AdditionalNotes,
                                AssemblyNameList = item.AssemblyNameList,
                                Attributes = item.Attributes,
                                Children = item.Children,
                                CommentId = item.CommentId,
                                DerivedClasses = item.DerivedClasses,
                                Documentation = item.Documentation,
                                Examples = item.Examples,
                                Exceptions = item.Exceptions,
                                ExtensionMethods = item.ExtensionMethods,
                                FullName = item.FullName,
                                FullNameForCSharp = item.FullNameForCSharp,
                                FullNameForVB = item.FullNameForVB,
                                FullNames = item.FullNames,
                                Href = item.Href,
                                Id = item.Id,
                                Implements = item.Implements,
                                Inheritance = item.Inheritance,
                                InheritedMembers = item.InheritedMembers,
                                IsExplicitInterfaceImplementation = item.IsExplicitInterfaceImplementation,
                                IsExtensionMethod = item.IsExtensionMethod,
                                Metadata = item.Metadata,
                                Modifiers = item.Modifiers,
                                Name = item.Name,
                                NameForCSharp = item.NameForCSharp,
                                NameForVB = item.NameForVB,
                                NameWithType = item.NameWithType,
                                NameWithTypeForCSharp = item.NameWithTypeForCSharp,
                                NameWithTypeForVB = item.NameWithTypeForVB,
                                Names = item.Names,
                                NamesWithType = item.NamesWithType,
                                NamespaceName = item.NamespaceName,
                                Overload = item.Overload,
                                Overridden = item.Overridden,
                                Parent = item.Parent,
                                Platform = item.Platform,
                                SeeAlsos = item.SeeAlsos,
                                Sees = item.Sees,
                                Source = item.Source,
                                SupportedLanguages = item.SupportedLanguages,
                                Syntax = item.Syntax,
                                Type = item.Type,
                                Uid = item.Uid,
                                Summary = summary,
                                Remarks = remarks,
                                Conceptual = conceptual
                            };
                        }
                        if (items != null || visitedItem != item)
                        {
                            if (items == null)
                            {
                                items = new List<ItemViewModel>(viewModel.Items.Take(j));
                            }
                            items.Add(visitedItem);
                        }
                    }

                    if (items != null) {
                        visitedViewModel = new PageViewModel
                        {
                            Metadata = viewModel.Metadata,
                            References = viewModel.References,
                            ShouldSkipMarkup = viewModel.ShouldSkipMarkup,
                            Items = items
                        };
                    }

                    if (visitedViewModel != viewModel) {
                        Console.WriteLine($"Updating links for '{model.File}'.");
                        visitedModel = new FileModel(
                            model.FileAndType,
                            visitedViewModel,
                            model.OriginalFileAndType,
                            model.Serializer,
                            model.Key)
                            {
                                LocalPathFromRoot = model.LocalPathFromRoot,
                                Uids = model.Uids,
                            };
                    }
                }
                if (updatedFileModels != null || visitedModel != model)
                {
                    if (updatedFileModels == null)
                    {
                        updatedFileModels = new List<FileModel>(models.Take(i));
                    }
                    updatedFileModels.Add(visitedModel);
                }
            }
            if (updatedFileModels != null)
            {
                return updatedFileModels;
            }
            return models;
        }

        public override void Postbuild(ImmutableList<FileModel> models, IHostService host)
        {
            base.Postbuild(models, host);
        }
   }
}
