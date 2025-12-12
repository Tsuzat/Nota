export default {
	type: 'doc',
	content: [
		{
			type: 'heading',
			attrs: {
				textAlign: 'center',
				id: 'e488834e-48fa-48a0-9323-7e8f3e1e6246',
				'data-toc-id': 'e488834e-48fa-48a0-9323-7e8f3e1e6246',
				level: 1
			},
			content: [{ type: 'text', text: 'Welcome to Nota' }]
		},
		{
			type: 'paragraph',
			attrs: { textAlign: 'justify' },
			content: [
				{
					type: 'text',
					text: 'Nota is a minimal, fast, modern and AI ready note taking application. We support'
				},
				{ type: 'text', marks: [{ type: 'bold' }], text: ' bold' },
				{ type: 'text', text: ', ' },
				{ type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
				{ type: 'text', text: ', ' },
				{ type: 'text', marks: [{ type: 'underline' }], text: 'underline' },
				{ type: 'text', text: ', ' },
				{
					type: 'text',
					marks: [
						{
							type: 'link',
							attrs: {
								href: 'https://nota.ink',
								target: '_tab',
								rel: 'noopener noreferrer nofollow',
								class: null
							}
						}
					],
					text: 'links'
				},
				{ type: 'text', text: ', ' },
				{ type: 'text', marks: [{ type: 'strike' }], text: 'strikethrough' },
				{ type: 'text', text: ', ' },
				{ type: 'text', marks: [{ type: 'code' }], text: 'inline code' },
				{ type: 'text', text: ', Superscript A' },
				{ type: 'text', marks: [{ type: 'superscript' }], text: 'b' },
				{ type: 'text', text: ' and subscript A' },
				{ type: 'text', marks: [{ type: 'subscript' }], text: 'b' },
				{ type: 'text', text: '. We support text colours like ' },
				{
					type: 'text',
					marks: [{ type: 'textStyle', attrs: { color: 'rgb(165, 42, 42)', fontSize: '' } }],
					text: 'red'
				},
				{ type: 'text', text: ', ' },
				{
					type: 'text',
					marks: [{ type: 'textStyle', attrs: { color: 'rgb(0, 0, 255)', fontSize: '' } }],
					text: 'blue'
				},
				{ type: 'text', text: ' and ' },
				{
					type: 'text',
					marks: [{ type: 'highlight', attrs: { color: '#008000' } }],
					text: 'highlights'
				},
				{
					type: 'text',
					text: '. Drag your mouse to see a contextual bubble menu for more actions. We support markdown shortcuts for these texts, similar to Notion. '
				}
			]
		},
		{
			type: 'blockquote',
			content: [
				{
					type: 'paragraph',
					attrs: { textAlign: 'justify' },
					content: [
						{
							type: 'text',
							text: 'We also have quote blocks. These can really differentiate your content while looking sleek and unbothered.'
						}
					]
				}
			]
		},
		{
			type: 'paragraph',
			attrs: { textAlign: 'justify' },
			content: [
				{
					type: 'text',
					text: 'We also have 4 levels of headings to give you a better experience on topics you are commiting to. Moreover, we have 3 types of lists.'
				}
			]
		},
		{
			type: 'orderedList',
			attrs: { start: 1, type: null },
			content: [
				{
					type: 'listItem',
					content: [
						{
							type: 'paragraph',
							attrs: { textAlign: null },
							content: [{ type: 'text', text: 'Numbered or ordered list' }]
						}
					]
				}
			]
		},
		{
			type: 'bulletList',
			content: [
				{
					type: 'listItem',
					content: [
						{
							type: 'paragraph',
							attrs: { textAlign: null },
							content: [{ type: 'text', text: 'Unordered List' }]
						}
					]
				}
			]
		},
		{
			type: 'taskList',
			content: [
				{
					type: 'taskItem',
					attrs: { checked: true },
					content: [
						{
							type: 'paragraph',
							attrs: { textAlign: null },
							content: [
								{
									type: 'text',
									text: 'Checklist for getting thing done. Do toggle this checklist.'
								}
							]
						}
					]
				},
				{
					type: 'taskItem',
					attrs: { checked: false },
					content: [
						{
							type: 'paragraph',
							attrs: { textAlign: null },
							content: [{ type: 'text', text: 'Hello World.' }]
						}
					]
				},
				{
					type: 'taskItem',
					attrs: { checked: false },
					content: [
						{
							type: 'paragraph',
							attrs: { textAlign: null },
							content: [{ type: 'text', text: 'This is really weird. ' }]
						}
					]
				}
			]
		},
		{ type: 'paragraph', attrs: { textAlign: null } },
		{
			type: 'blockquote',
			content: [
				{
					type: 'paragraph',
					attrs: { textAlign: null },
					content: [
						{
							type: 'text',
							marks: [{ type: 'textStyle', attrs: { color: '#DB0762', fontSize: null } }],
							text: 'Tip: Click on the drag handle to see more options. Drag and drop things here and there for fun.'
						}
					]
				}
			]
		},
		{ type: 'horizontalRule' },
		{
			type: 'heading',
			attrs: {
				textAlign: null,
				id: '756407f7-d276-47d8-bfec-515581b4485e',
				'data-toc-id': '756407f7-d276-47d8-bfec-515581b4485e',
				level: 2
			},
			content: [{ type: 'text', text: 'Code Block and Highlights' }]
		},
		{
			type: 'codeBlock',
			attrs: { language: 'go' },
			content: [
				{
					type: 'text',
					text: 'func twoSum(nums []int, target int) []int { \n\tvar res []int\n\tmp := make(map[int]int)\n\tfor idx, val := range nums {\n\t\ttoBeSearched := target - val\n\t\tif _, ok := mp[toBeSearched]; ok {\n\t\t\tres = append(res, mp[toBeSearched], idx)\n\t\t\tbreak\n\t\t}\n\t\tmp[val] = idx\n\t}\n\treturn res\n}'
				}
			]
		},
		{ type: 'horizontalRule' },
		{
			type: 'heading',
			attrs: {
				textAlign: null,
				id: '0dab42e3-78b4-441d-9bfb-94390cbb232a',
				'data-toc-id': '0dab42e3-78b4-441d-9bfb-94390cbb232a',
				level: 2
			},
			content: [{ type: 'text', text: 'Media and Placeholders' }]
		},
		{
			type: 'image',
			attrs: {
				src: 'https://placehold.co/800x400/6A00F5/white',
				alt: null,
				title: null,
				width: '74.08854166666666%',
				height: null,
				align: 'center'
			}
		},
		{
			type: 'video',
			attrs: {
				src: 'https://videos.pexels.com/video-files/2491284/2491284-uhd_2732_1440_24fps.mp4',
				alt: null,
				title: null,
				width: '75.15151515151514%',
				height: null,
				align: 'center'
			}
		},
		{
			type: 'audio',
			attrs: {
				src: 'https://cdn.pixabay.com/audio/2024/10/30/audio_42e6870f29.mp3',
				alt: null,
				title: null,
				width: '57.47474747474747%',
				height: null,
				align: 'center'
			}
		},
		{
			type: 'iframe',
			attrs: {
				src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3748.5645078258503!2d75.17451197505285!3d20.026784381383496!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdb93bd138ae4bd%3A0x574c6482cf0b89cf!2sEllora%20Caves!5e0!3m2!1sen!2sin!4v1742466514831!5m2!1sen!2sin',
				alt: null,
				title: null,
				width: '75.69444444444444%',
				height: null,
				align: 'center'
			}
		},
		{ type: 'horizontalRule' },
		{
			type: 'heading',
			attrs: {
				textAlign: null,
				id: 'cc8a36c5-b9cc-4f4a-9fc1-9c247080927f',
				'data-toc-id': 'cc8a36c5-b9cc-4f4a-9fc1-9c247080927f',
				level: 2
			},
			content: [{ type: 'text', text: 'Typography' }]
		},
		{
			type: 'paragraph',
			attrs: { textAlign: null },
			content: [
				{ type: 'text', text: 'Typography support e.g. type ' },
				{ type: 'text', marks: [{ type: 'code' }], text: '!=' },
				{
					type: 'text',
					text: ' and it becomes ≠. Similarly (c) becomes ©, -> becomes → and many more like 1×2, ½. We also have color visualizer. #FFF, #000, #FF00FF can be visualised.'
				}
			]
		},
		{ type: 'horizontalRule' },
		{
			type: 'heading',
			attrs: {
				textAlign: null,
				id: '7be29895-c6cd-4c7b-a2a5-89f9aad52e80',
				'data-toc-id': '7be29895-c6cd-4c7b-a2a5-89f9aad52e80',
				level: 2
			},
			content: [{ type: 'text', text: 'Tables' }]
		},
		{
			type: 'paragraph',
			attrs: { textAlign: null },
			content: [
				{
					type: 'text',
					text: 'We support tables with many customisations. Click on them and explore things.'
				}
			]
		},
		{
			type: 'table',
			content: [
				{
					type: 'tableRow',
					content: [
						{
							type: 'tableHeader',
							attrs: { colspan: 1, rowspan: 1, colwidth: [138], style: null },
							content: [
								{
									type: 'paragraph',
									attrs: { textAlign: null },
									content: [{ type: 'text', text: 'No' }]
								}
							]
						},
						{
							type: 'tableHeader',
							attrs: { colspan: 1, rowspan: 1, colwidth: [151], style: null },
							content: [
								{
									type: 'paragraph',
									attrs: { textAlign: null },
									content: [{ type: 'text', text: 'Item' }]
								}
							]
						},
						{
							type: 'tableHeader',
							attrs: { colspan: 1, rowspan: 1, colwidth: [136], style: null },
							content: [
								{
									type: 'paragraph',
									attrs: { textAlign: null },
									content: [{ type: 'text', text: 'Quantity' }]
								}
							]
						}
					]
				},
				{
					type: 'tableRow',
					content: [
						{
							type: 'tableCell',
							attrs: { colspan: 1, rowspan: 1, colwidth: [138], style: null },
							content: [
								{
									type: 'paragraph',
									attrs: { textAlign: null },
									content: [{ type: 'text', text: '1' }]
								}
							]
						},
						{
							type: 'tableCell',
							attrs: { colspan: 1, rowspan: 1, colwidth: [151], style: null },
							content: [
								{
									type: 'paragraph',
									attrs: { textAlign: null },
									content: [{ type: 'text', text: 'Banana' }]
								}
							]
						},
						{
							type: 'tableCell',
							attrs: { colspan: 1, rowspan: 1, colwidth: [136], style: null },
							content: [
								{
									type: 'paragraph',
									attrs: { textAlign: null },
									content: [{ type: 'text', text: '12' }]
								}
							]
						}
					]
				},
				{
					type: 'tableRow',
					content: [
						{
							type: 'tableCell',
							attrs: { colspan: 1, rowspan: 1, colwidth: [138], style: null },
							content: [
								{
									type: 'paragraph',
									attrs: { textAlign: null },
									content: [{ type: 'text', text: '2' }]
								}
							]
						},
						{
							type: 'tableCell',
							attrs: { colspan: 1, rowspan: 1, colwidth: [151], style: null },
							content: [
								{
									type: 'paragraph',
									attrs: { textAlign: null },
									content: [{ type: 'text', text: 'Apple' }]
								}
							]
						},
						{
							type: 'tableCell',
							attrs: { colspan: 1, rowspan: 1, colwidth: [136], style: null },
							content: [
								{
									type: 'paragraph',
									attrs: { textAlign: null },
									content: [{ type: 'text', text: '19' }]
								}
							]
						}
					]
				}
			]
		},
		{ type: 'horizontalRule' },
		{
			type: 'heading',
			attrs: {
				textAlign: null,
				id: '678746d9-33a7-42a9-859f-3e88869eee24',
				'data-toc-id': '678746d9-33a7-42a9-859f-3e88869eee24',
				level: 2
			},
			content: [
				{
					type: 'text',
					marks: [
						{ type: 'textStyle', attrs: { color: 'var(--tw-prose-headings)', fontSize: '' } }
					],
					text: 'Rending Math and '
				},
				{ type: 'inlineMath', attrs: { latex: '\\LaTeX' } },
				{
					type: 'text',
					marks: [{ type: 'textStyle', attrs: { color: null, fontSize: '' } }],
					text: '. '
				}
			]
		},
		{
			type: 'paragraph',
			attrs: { textAlign: null },
			content: [
				{ type: 'text', text: 'The editor supports the' },
				{ type: 'inlineMath', attrs: { latex: '\\LaTeX' } },
				{ type: 'text', text: ' rendering. e.g.' }
			]
		},
		{
			type: 'orderedList',
			attrs: { start: 1, type: null },
			content: [
				{
					type: 'listItem',
					content: [
						{
							type: 'paragraph',
							attrs: { textAlign: null },
							content: [
								{
									type: 'text',
									marks: [
										{ type: 'textStyle', attrs: { color: 'rgb(165, 42, 42)', fontSize: '' } }
									],
									text: 'Functions like'
								},
								{ type: 'text', text: ',' },
								{ type: 'inlineMath', attrs: { latex: 'sin² \\theta + cos² \\theta = 1' } }
							]
						}
					]
				},
				{
					type: 'listItem',
					content: [
						{
							type: 'paragraph',
							attrs: { textAlign: null },
							content: [
								{
									type: 'text',
									marks: [{ type: 'highlight', attrs: { color: '#A52A2A' } }],
									text: 'Matrix like unit matrix'
								}
							]
						},
						{
							type: 'paragraph',
							attrs: { textAlign: null },
							content: [
								{
									type: 'inlineMath',
									attrs: { latex: '\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}' }
								}
							]
						},
						{
							type: 'paragraph',
							attrs: { textAlign: null },
							content: [{ type: 'text', text: 'or more matrices like' }]
						},
						{
							type: 'blockMath',
							attrs: {
								latex:
									'\\begin{pmatrix} 1 & 0 & \\cdots & 0 \\\\ 0 & 1 & \\cdots & 0 \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ 0 & 0 & \\cdots & 1 \\end{pmatrix}'
							}
						},
						{ type: 'paragraph', attrs: { textAlign: null } }
					]
				}
			]
		},
		{
			type: 'paragraph',
			attrs: { textAlign: null },
			content: [{ type: 'text', text: 'Explore More…' }]
		},
		{ type: 'paragraph', attrs: { textAlign: null } },
		{ type: 'paragraph', attrs: { textAlign: null } },
		{ type: 'paragraph', attrs: { textAlign: null } },
		{ type: 'paragraph', attrs: { textAlign: null } }
	]
};
